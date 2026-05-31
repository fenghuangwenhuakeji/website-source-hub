Modules.writer = Modules.writer || {};

(() => {
    const SETTINGS_ID = 'writer_polish_settings';
    const DEEPSEEK_RECIPE_ID = 'deepseek-v4-humanize-v1';
    const DEFAULT_SETTINGS = Object.freeze({
        autoPolishEnabled: false,
        chunkSize: 2200,
        minChunkSize: 900,
        contextChars: 180,
        maxChunks: 24,
        typewriterDelay: 12,
        typewriterStep: 3,
        validateMinRatio: 0.55,
        validateMaxRatio: 1.85,
        recipeId: 'default-v1',
        deepseekV4: { enabled: false },
        customRules: '',
        regexRules: [],
        fallback: 'original'
    });

    function clampNumber(value, fallback, min, max) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.min(max, Math.max(min, numeric));
    }

    function cloneRegexRules(rules) {
        if (!Array.isArray(rules)) return [];
        return rules
            .filter(Boolean)
            .map(rule => {
                if (rule instanceof RegExp) {
                    return { pattern: rule.source, flags: rule.flags, replacement: '' };
                }
                if (typeof rule === 'string') {
                    return { pattern: rule, flags: 'g', replacement: '' };
                }
                return {
                    pattern: String(rule.pattern || ''),
                    flags: String(rule.flags || ''),
                    replacement: rule.replacement == null ? '' : String(rule.replacement),
                    enabled: rule.enabled !== false
                };
            })
            .filter(rule => rule.pattern);
    }

    function normalizeSettings(raw = {}) {
        const chunkSize = clampNumber(
            raw.chunkSize ?? raw.maxChunkLength,
            DEFAULT_SETTINGS.chunkSize,
            600,
            20000
        );
        const minChunkSize = clampNumber(
            raw.minChunkSize,
            Math.min(DEFAULT_SETTINGS.minChunkSize, chunkSize),
            200,
            chunkSize
        );
        return {
            id: SETTINGS_ID,
            autoPolishEnabled: !!(raw.autoPolishEnabled ?? raw.autoPolish ?? raw.enabled ?? DEFAULT_SETTINGS.autoPolishEnabled),
            autoPolish: !!(raw.autoPolishEnabled ?? raw.autoPolish ?? raw.enabled ?? DEFAULT_SETTINGS.autoPolishEnabled),
            applyToBatch: raw.applyToBatch !== false,
            chunkSize,
            minChunkSize,
            contextChars: clampNumber(
                raw.contextChars ?? raw.overlap,
                DEFAULT_SETTINGS.contextChars,
                0,
                4000
            ),
            maxChunks: clampNumber(raw.maxChunks, DEFAULT_SETTINGS.maxChunks, 1, 200),
            typewriterDelay: clampNumber(
                raw.typewriterDelay ?? raw.typewriterSpeed ?? raw.renderDelay,
                DEFAULT_SETTINGS.typewriterDelay,
                0,
                200
            ),
            typewriterSpeed: clampNumber(
                raw.typewriterDelay ?? raw.typewriterSpeed ?? raw.renderDelay,
                DEFAULT_SETTINGS.typewriterDelay,
                0,
                200
            ),
            typewriterStep: clampNumber(
                raw.typewriterStep ?? raw.renderStep,
                DEFAULT_SETTINGS.typewriterStep,
                1,
                80
            ),
            validateMinRatio: clampNumber(
                raw.validateMinRatio,
                DEFAULT_SETTINGS.validateMinRatio,
                0.1,
                1
            ),
            validateMaxRatio: clampNumber(
                raw.validateMaxRatio,
                DEFAULT_SETTINGS.validateMaxRatio,
                1,
                4
            ),
            recipeId: String(raw.recipeId || DEFAULT_SETTINGS.recipeId).trim() || DEFAULT_SETTINGS.recipeId,
            deepseekV4: Object.assign({}, DEFAULT_SETTINGS.deepseekV4, raw.deepseekV4 || {}),
            customRules: String(raw.customRules || '').trim(),
            regexRules: cloneRegexRules(raw.regexRules),
            fallback: String(raw.fallback || DEFAULT_SETTINGS.fallback).trim() || DEFAULT_SETTINGS.fallback
        };
    }

    function isDeepSeekRecipeActive(settings = {}) {
        return settings.recipeId === DEEPSEEK_RECIPE_ID && settings.deepseekV4?.enabled === true;
    }

    function withDeepSeekRecipeSettings(raw = {}) {
        const current = normalizeSettings(raw || {});
        return normalizeSettings({
            ...current,
            recipeId: DEEPSEEK_RECIPE_ID,
            deepseekV4: {
                ...(current.deepseekV4 || {}),
                enabled: true
            }
        });
    }

    function copySettings(settings) {
        return {
            ...settings,
            regexRules: cloneRegexRules(settings.regexRules)
        };
    }

    function pickText(...values) {
        for (const value of values) {
            if (typeof value === 'string' && value.trim()) return value.trim();
        }
        return '';
    }

    function resolveTarget(target) {
        if (!target) return null;
        if (typeof target === 'string') return document.querySelector(target);
        return target;
    }

    function findBreakByRegex(text, minChars, pattern, postProcess) {
        let match;
        let best = -1;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text))) {
            const end = typeof postProcess === 'function'
                ? postProcess(match)
                : match.index + match[0].length;
            if (end >= minChars) best = end;
        }
        return best;
    }

    function findChunkEnd(source, start, maxChars, minChars) {
        const hardEnd = Math.min(source.length, start + maxChars);
        if (hardEnd >= source.length) return source.length;
        const windowText = source.slice(start, hardEnd);

        const paragraphEnd = findBreakByRegex(windowText, minChars, /\n{2,}/g);
        if (paragraphEnd > -1) return start + paragraphEnd;

        const sentenceEnd = findBreakByRegex(
            windowText,
            minChars,
            /[。！？!?；;][”"'」』】）)]?(?:\s|\n|$)/g
        );
        if (sentenceEnd > -1) return start + sentenceEnd;

        const lineEnd = findBreakByRegex(windowText, minChars, /\n+/g);
        if (lineEnd > -1) return start + lineEnd;

        return hardEnd;
    }

    function resolveFallbackText(options, originalText) {
        if (typeof options.fallback === 'function') {
            try {
                return String(options.fallback(originalText) || '');
            } catch (error) {
                console.warn('[Writer polish] fallback function failed:', error);
            }
        }
        if (typeof options.fallback === 'string') return options.fallback;
        return String(originalText || '');
    }

    Object.assign(Modules.writer, {
        _polishSettingsCache: null,

        async _isAutoPolishEnabled() {
            const settings = await this._getPolishSettings();
            if (settings.autoPolishEnabled && !isDeepSeekRecipeActive(settings)) {
                try {
                    await this._savePolishSettings(withDeepSeekRecipeSettings(settings));
                } catch (error) {
                    console.warn('[Writer polish] enable DeepSeek recipe for auto polish failed:', error);
                }
            }
            return !!settings.autoPolishEnabled;
        },

        async _getPolishSettings(forceRefresh = false) {
            if (!forceRefresh && this._polishSettingsCache) {
                return copySettings(this._polishSettingsCache);
            }

            let stored = null;
            if (typeof DB !== 'undefined' && typeof DB.get === 'function') {
                try {
                    stored = await DB.get('settings', SETTINGS_ID);
                } catch (error) {
                    console.warn('[Writer polish] read settings failed:', error);
                }
            }

            this._polishSettingsCache = normalizeSettings(stored || {});
            return copySettings(this._polishSettingsCache);
        },

        async _savePolishSettings(patch = {}) {
            const current = await this._getPolishSettings();
            const next = normalizeSettings({
                ...current,
                ...patch,
                regexRules: patch.regexRules ?? current.regexRules
            });

            this._polishSettingsCache = next;

            if (typeof DB !== 'undefined' && typeof DB.put === 'function') {
                try {
                    await DB.put('settings', { id: SETTINGS_ID, ...next });
                } catch (error) {
                    console.warn('[Writer polish] save settings failed:', error);
                }
            }

            return copySettings(next);
        },

        async _ensureDeepSeekPolishEnabled(patch = {}) {
            const current = await this._getPolishSettings();
            const next = withDeepSeekRecipeSettings({
                ...current,
                ...patch,
                deepseekV4: {
                    ...(current.deepseekV4 || {}),
                    ...(patch.deepseekV4 || {}),
                    enabled: true
                }
            });
            await this._savePolishSettings(next);
            return copySettings(next);
        },

        async _getPolishRulesBundle(options = {}) {
            const settings = options.settings || await this._getPolishSettings();
            let storedRules = options.writerRulesData || null;

            if (!storedRules && typeof DB !== 'undefined' && typeof DB.get === 'function') {
                try {
                    storedRules = await DB.get('settings', 'writer_rules');
                } catch (error) {
                    console.warn('[Writer polish] read writer_rules failed:', error);
                }
            }

            const domRules = (document.getElementById('w-rules') || {}).value || '';
            const domPolishRules = (document.getElementById('w-polish-rules') || {}).value || '';
            const domExtracted = (document.getElementById('w-style-extracted') || {}).value || '';

            const globalRules = pickText(options.rules, options.globalRules, domRules, storedRules?.rules);
            const polishRules = pickText(options.polishRules, domPolishRules, storedRules?.polishRules);
            const styleExtracted = pickText(
                options.styleExtracted,
                this._getExtractedStyle ? this._getExtractedStyle() : '',
                domExtracted,
                storedRules?.styleExtracted
            );
            const customRules = pickText(options.customRules, settings.customRules);

            const preferredSections = [];
            let preferredSource = 'mandatory';

            if (styleExtracted) {
                preferredSections.push(styleExtracted);
                preferredSource = 'style-extracted';
            } else if (polishRules) {
                preferredSections.push(polishRules);
                preferredSource = 'polish-rules';
            } else if (globalRules) {
                preferredSections.push(globalRules);
                preferredSource = 'global-rules';
            }

            if (customRules) preferredSections.push(customRules);

            const mandatoryRules = this._getMandatoryStyleRules
                ? this._getMandatoryStyleRules()
                : '';
            const combinedRules = this._mergeStyleRules
                ? this._mergeStyleRules(...preferredSections)
                : [mandatoryRules, ...preferredSections].filter(Boolean).join('\n\n');

            return {
                settings,
                mandatoryRules,
                globalRules,
                polishRules,
                styleExtracted,
                customRules,
                preferredSource,
                regexRules: cloneRegexRules(settings.regexRules),
                combinedRules: combinedRules || mandatoryRules || ''
            };
        },

        _applyPolishRegex(text, rulesOrOptions = {}) {
            const options = Array.isArray(rulesOrOptions)
                ? { rules: rulesOrOptions }
                : (rulesOrOptions || {});
            const fallback = options.fallback !== undefined ? String(options.fallback) : String(text || '');
            let output = String(text || '');

            let rules = Array.isArray(options.rules) ? options.rules : [];
            if (!rules.length && options.settings && Array.isArray(options.settings.regexRules)) {
                rules = options.settings.regexRules;
            } else if (!rules.length && this._polishSettingsCache?.regexRules?.length) {
                rules = this._polishSettingsCache.regexRules;
            }

            for (const rule of rules) {
                if (!rule) continue;
                try {
                    if (rule instanceof RegExp) {
                        output = output.replace(rule, '');
                        continue;
                    }
                    if (rule.enabled === false) continue;
                    const pattern = rule.pattern || rule.source;
                    if (!pattern) continue;
                    const flags = String(rule.flags || '');
                    const replacement = rule.replacement == null ? '' : String(rule.replacement);
                    output = output.replace(new RegExp(pattern, flags), replacement);
                } catch (error) {
                    console.warn('[Writer polish] regex rule skipped:', error, rule);
                }
            }

            if (options.skipSanitize !== true) {
                output = this._sanitizeEditableProse
                    ? this._sanitizeEditableProse(output)
                    : String(output).trim();
            }

            return output || fallback;
        },

        _splitChapterForPolish(text, options = {}) {
            const source = String(text || '').replace(/\r\n?/g, '\n');
            if (!source) return [];

            let maxChars = clampNumber(
                options.maxChars ?? options.chunkSize,
                DEFAULT_SETTINGS.chunkSize,
                600,
                20000
            );
            const maxChunks = clampNumber(
                options.maxChunks,
                DEFAULT_SETTINGS.maxChunks,
                1,
                200
            );
            if (source.length > maxChars * maxChunks) {
                maxChars = Math.ceil(source.length / maxChunks);
            }

            const minChars = clampNumber(
                options.minChars ?? options.minChunkSize,
                Math.min(DEFAULT_SETTINGS.minChunkSize, maxChars),
                200,
                maxChars
            );
            const contextChars = clampNumber(
                options.contextChars ?? options.overlap,
                DEFAULT_SETTINGS.contextChars,
                0,
                4000
            );

            const chunks = [];
            let start = 0;
            while (start < source.length) {
                const end = findChunkEnd(source, start, maxChars, minChars);
                const chunkText = source.slice(start, end);
                chunks.push({
                    index: chunks.length,
                    start,
                    end,
                    text: chunkText,
                    contextBefore: source.slice(Math.max(0, start - contextChars), start),
                    contextAfter: source.slice(end, Math.min(source.length, end + contextChars))
                });
                if (end <= start) break;
                start = end;
            }

            return chunks.map((chunk, index) => ({
                ...chunk,
                index,
                total: chunks.length
            }));
        },

        async _buildPolishPrompt(options = {}) {
            const bundle = options.bundle || await this._getPolishRulesBundle(options);
            const currentText = String(
                options.text ?? options.chunkText ?? options.input ?? options.content ?? ''
            );
            const chunkIndex = Number.isInteger(options.chunkIndex)
                ? options.chunkIndex
                : Number.isInteger(options.chunk?.index)
                    ? options.chunk.index
                    : 0;
            const totalChunks = Number.isInteger(options.totalChunks)
                ? options.totalChunks
                : Number.isInteger(options.chunk?.total)
                    ? options.chunk.total
                    : 1;
            const title = pickText(options.title, (document.getElementById('w-title') || {}).value);
            const outline = String(
                options.outline ?? ((document.getElementById('w-outline') || {}).value || '')
            ).trim();
            const extraInstruction = String(options.extraInstruction || '').trim();

            if (
                bundle.settings?.recipeId === 'deepseek-v4-humanize-v1' &&
                bundle.settings?.deepseekV4?.enabled === true &&
                typeof this._buildDeepSeekPolishPrompt === 'function'
            ) {
                return this._buildDeepSeekPolishPrompt({
                    ...options,
                    text: currentText,
                    title,
                    outline,
                    extraInstruction: [
                        extraInstruction,
                        bundle.combinedRules ? '[执笔台既有强制规则]\n' + bundle.combinedRules : '',
                        '[DeepSeek 全量润色配方优先]\n对话引号以 DeepSeek 正则+提示词配方为准，最终统一为「」；忽略既有规则中“严禁「」”或“只能用中文双引号”的冲突条款。'
                    ].filter(Boolean).join('\n\n')
                });
            }

            let promptTpl = String(options.promptTemplate || '').trim();
            if (!promptTpl && Modules.short?.getPrompt) {
                try {
                    promptTpl = String(await Modules.short.getPrompt('writer_polish') || '').trim();
                } catch (error) {
                    console.warn('[Writer polish] load writer_polish prompt failed:', error);
                }
            }

            if (!promptTpl) {
                promptTpl = [
                    '你是长篇小说润色编辑。',
                    '请在不改变剧情事实、人物设定、时间线、信息量和叙事视角的前提下，只润色当前正文。',
                    '优化句式、节奏、画面感和可读性，但不要补写新剧情，不要删掉关键细节，不要输出说明。',
                    '',
                    '[规则]',
                    '{{rules}}',
                    '',
                    '[正文]',
                    '{{input}}'
                ].join('\n');
            }

            const corePrompt = promptTpl
                .replace('{{rules}}', bundle.combinedRules || '')
                .replace('{{input}}', currentText);

            const metaBlocks = [
                '[润色任务]',
                title ? `[章节标题] ${title}` : '',
                totalChunks > 1 ? `[当前分块] ${chunkIndex + 1}/${totalChunks}` : '',
                `[规则来源] ${bundle.preferredSource || 'mandatory'}`,
                '[硬性要求] 只输出当前正文的润色结果；不输出标题、分析、说明、清单、注释。'
            ].filter(Boolean);

            if (outline) {
                metaBlocks.push('[章节细纲参考]\n' + outline.slice(0, options.outlineLimit || 1800));
            }
            if (options.contextBefore) {
                metaBlocks.push(
                    '[前文衔接参考，仅供保持语气与动作连续，不要重复输出]\n' +
                    String(options.contextBefore).slice(-(options.contextLimit || 400))
                );
            }
            if (options.contextAfter) {
                metaBlocks.push(
                    '[后文衔接参考，仅供保持段落自然收束，不要提前改写]\n' +
                    String(options.contextAfter).slice(0, options.contextLimit || 400)
                );
            }
            if (extraInstruction) metaBlocks.push('[补充要求]\n' + extraInstruction);

            return [
                metaBlocks.join('\n\n'),
                corePrompt,
                '[输出要求] 直接输出润色后的当前正文，不要带引导语。'
            ].filter(Boolean).join('\n\n');
        },

        async _polishText(text, options = {}) {
            const originalText = String(text ?? options.text ?? '');
            const fallbackText = resolveFallbackText(options, originalText);
            if (!originalText.trim()) {
                return options.returnMeta
                    ? { text: fallbackText, chunks: [], chunkCount: 0, usedFallback: fallbackText !== originalText }
                    : fallbackText;
            }

            let settings = options.settings || await this._getPolishSettings();
            if (options.forceDeepSeekRecipe) {
                settings = withDeepSeekRecipeSettings(settings);
            }
            const bundle = options.bundle || await this._getPolishRulesBundle({ ...options, settings });
            const usedDeepSeek = isDeepSeekRecipeActive(settings) && typeof this._buildDeepSeekPolishPrompt === 'function';
            this._lastPolishRunMeta = {
                source: options.source || options.mode || 'unknown',
                mode: options.mode || '',
                status: 'running',
                forceDeepSeekRecipe: !!options.forceDeepSeekRecipe,
                usedDeepSeek,
                recipeId: settings.recipeId,
                oldSanitizeBeforeDeepSeek: usedDeepSeek,
                finalSanitizeMode: usedDeepSeek ? 'safety-only-preserve-corner-quotes' : 'default',
                startedAt: Date.now(),
                originalLength: originalText.length
            };
            const chunks = options.forceSingleChunk
                ? [{
                    index: 0,
                    total: 1,
                    start: 0,
                    end: originalText.length,
                    text: originalText,
                    contextBefore: '',
                    contextAfter: ''
                }]
                : this._splitChapterForPolish(originalText, {
                    maxChars: options.maxChars ?? settings.chunkSize,
                    minChars: options.minChars ?? settings.minChunkSize,
                    contextChars: options.contextChars ?? settings.contextChars,
                    maxChunks: options.maxChunks ?? settings.maxChunks
                });

            const outputs = [];
            const metaChunks = [];
            let usedFallback = false;

            for (const chunk of chunks) {
                const prompt = await this._buildPolishPrompt({
                    ...options,
                    settings,
                    bundle,
                    text: chunk.text,
                    chunk,
                    chunkIndex: chunk.index,
                    totalChunks: chunk.total,
                    contextBefore: chunk.contextBefore,
                    contextAfter: chunk.contextAfter
                });

                if (typeof this.updateIO === 'function') {
                    this.updateIO(prompt, usedDeepSeek ? 'DeepSeek 全量正则+提示词润色中...' : '润色中...');
                }

                let rawResult = '';
                const aiOptions = {
                    apiType: 'text',
                    module: 'writer_polish',
                    ...(options.aiOptions || {})
                };

                try {
                    if (typeof options.onChunk === 'function') {
                        await AI.generate(prompt, aiOptions, piece => {
                            rawResult += piece;
                            options.onChunk(piece, {
                                chunkIndex: chunk.index,
                                totalChunks: chunk.total,
                                prompt,
                                chunk
                            });
                        });
                    } else {
                        rawResult = await AI.generate(prompt, aiOptions);
                    }
                } catch (error) {
                    console.warn('[Writer polish] AI polish failed:', error);
                    if (typeof options.onError === 'function') {
                        try {
                            options.onError(error, { chunkIndex: chunk.index, prompt, chunk });
                        } catch (notifyError) {
                            console.warn('[Writer polish] onError hook failed:', notifyError);
                        }
                    }
                    if (options.throwOnError) throw error;
                    rawResult = '';
                }

                const normalized = (
                    usedDeepSeek &&
                    typeof this._applyDeepSeekHumanizePostRules === 'function'
                )
                    ? this._applyDeepSeekHumanizePostRules(rawResult, { phase: 'chunk' })
                    : this._applyPolishRegex(rawResult, {
                        settings,
                        rules: options.regexRules,
                        fallback: chunk.text
                    });
                const validation = this._validatePolishResult(chunk.text, normalized, {
                    settings,
                    fallback: chunk.text,
                    minLengthRatio: options.minLengthRatio,
                    maxLengthRatio: options.maxLengthRatio,
                    regexRules: options.regexRules
                });

                outputs.push(validation.text);
                metaChunks.push({
                    index: chunk.index,
                    total: chunk.total,
                    start: chunk.start,
                    end: chunk.end,
                    promptLength: prompt.length,
                    outputLength: validation.text.length,
                    usedFallback: validation.usedFallback,
                    reason: validation.reason
                });
                usedFallback = usedFallback || validation.usedFallback;

                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            chunkIndex: chunk.index,
                            totalChunks: chunk.total,
                            text: validation.text,
                            usedFallback: validation.usedFallback,
                            reason: validation.reason
                        });
                    } catch (error) {
                        console.warn('[Writer polish] onProgress hook failed:', error);
                    }
                }
            }

            const joined = outputs.join('');
            const finalText = (
                usedDeepSeek &&
                typeof this._applyDeepSeekHumanizePostRules === 'function'
            )
                ? this._applyDeepSeekHumanizePostRules(joined, { phase: 'final' })
                : this._applyPolishRegex(joined, {
                    settings,
                    rules: options.finalRegexRules ?? options.regexRules,
                    fallback: fallbackText
                });
            const finalValidation = this._validatePolishResult(originalText, finalText, {
                settings,
                fallback: fallbackText,
                minLengthRatio: options.finalMinLengthRatio ?? options.minLengthRatio,
                maxLengthRatio: options.finalMaxLengthRatio ?? options.maxLengthRatio,
                regexRules: options.finalRegexRules ?? options.regexRules
            });

            usedFallback = usedFallback || finalValidation.usedFallback;
            this._lastPolishRunMeta = {
                ...(this._lastPolishRunMeta || {}),
                status: 'completed',
                endedAt: Date.now(),
                chunkCount: chunks.length,
                usedFallback,
                reason: finalValidation.reason,
                outputLength: finalValidation.text.length
            };

            if (options.returnMeta) {
                return {
                    text: finalValidation.text,
                    chunks: metaChunks,
                    chunkCount: chunks.length,
                    usedFallback,
                    reason: finalValidation.reason,
                    rulesBundle: bundle
                };
            }

            return finalValidation.text;
        },

        _validatePolishResult(originalText, polishedText, options = {}) {
            const settings = options.settings || this._polishSettingsCache || DEFAULT_SETTINGS;
            const usedDeepSeek = isDeepSeekRecipeActive(settings);
            const sourceSanitizeOptions = usedDeepSeek
                ? { preserveCornerQuotes: false }
                : {};
            const outputSanitizeOptions = usedDeepSeek
                ? { preserveCornerQuotes: true, safetyOnly: true }
                : {};
            const rawFallbackText = resolveFallbackText(options, originalText);
            const fallbackText = usedDeepSeek && typeof this._sanitizeDeepSeekInputProse === 'function'
                ? this._sanitizeDeepSeekInputProse(rawFallbackText)
                : rawFallbackText;
            const source = this._sanitizeEditableProse
                ? this._sanitizeEditableProse(String(originalText || ''), sourceSanitizeOptions)
                : String(originalText || '').trim();
            const output = this._sanitizeEditableProse
                ? this._sanitizeEditableProse(String(polishedText || ''), outputSanitizeOptions)
                : String(polishedText || '').trim();

            if (!output) {
                return { ok: false, text: fallbackText, reason: 'empty', usedFallback: true };
            }

            const metaPattern = /^(?:#{1,6}\s|[-*]\s|润色说明[:：]|修改说明[:：]|以下是|总结[:：]|分析[:：])/m;
            if (metaPattern.test(output)) {
                return { ok: false, text: fallbackText, reason: 'meta-output', usedFallback: true };
            }

            if (source) {
                const ratio = output.length / Math.max(1, source.length);
                const minRatio = clampNumber(
                    options.minLengthRatio,
                    settings.validateMinRatio,
                    0.1,
                    1
                );
                const maxRatio = clampNumber(
                    options.maxLengthRatio,
                    settings.validateMaxRatio,
                    1,
                    4
                );

                if (ratio < minRatio || ratio > maxRatio) {
                    return {
                        ok: false,
                        text: fallbackText,
                        reason: `length-ratio:${ratio.toFixed(3)}`,
                        usedFallback: true
                    };
                }
            }

            return {
                ok: true,
                text: output,
                reason: 'ok',
                usedFallback: false
            };
        },

        _renderTypewriter(target, text, options = {}) {
            const el = resolveTarget(target);
            const settings = options.settings || this._polishSettingsCache || DEFAULT_SETTINGS;
            const content = String(text || '');
            const delay = clampNumber(
                options.delay,
                settings.typewriterDelay,
                0,
                200
            );
            const step = clampNumber(
                options.step,
                settings.typewriterStep,
                1,
                80
            );

            if (!el) {
                return {
                    stop() {},
                    promise: Promise.resolve(content)
                };
            }

            const prop = 'value' in el ? 'value' : 'textContent';
            const prefix = String(options.prefixText || '');
            const fullText = options.fullText || (prefix + content);
            let index = 0;
            let timer = null;
            let stopped = false;

            if (options.clear !== false) el[prop] = prefix;
            if (!delay || content.length <= step) {
                el[prop] = fullText;
                if (typeof options.onInput === 'function') options.onInput();
                if (typeof options.onUpdate === 'function') options.onUpdate(fullText);
                return {
                    stop() {},
                    promise: Promise.resolve(fullText)
                };
            }

            const promise = new Promise(resolve => {
                const tick = () => {
                    if (stopped) {
                        resolve(String(el[prop] || ''));
                        return;
                    }

                    index = Math.min(content.length, index + step);
                    el[prop] = prefix + content.slice(0, index);

                    if (options.scrollToEnd && 'scrollTop' in el) {
                        el.scrollTop = el.scrollHeight;
                    }
                    if (typeof options.onInput === 'function') {
                        try {
                            options.onInput();
                        } catch (error) {
                            console.warn('[Writer polish] typewriter onInput failed:', error);
                        }
                    }
                    if (typeof options.onUpdate === 'function') {
                        try {
                            options.onUpdate(String(el[prop] || ''));
                        } catch (error) {
                            console.warn('[Writer polish] typewriter onUpdate failed:', error);
                        }
                    }

                    if (typeof options.onTick === 'function') {
                        try {
                            options.onTick(String(el[prop] || ''), {
                                index,
                                total: content.length,
                                target: el
                            });
                        } catch (error) {
                            console.warn('[Writer polish] typewriter onTick failed:', error);
                        }
                    }

                    if (index >= content.length) {
                        if (typeof options.onDone === 'function') {
                            try {
                                options.onDone(fullText, { target: el });
                            } catch (error) {
                                console.warn('[Writer polish] typewriter onDone failed:', error);
                            }
                        }
                        resolve(fullText);
                        return;
                    }

                    timer = setTimeout(tick, delay);
                };

                tick();
            });

            return {
                stop() {
                    stopped = true;
                    if (timer) clearTimeout(timer);
                },
                promise
            };
        }
    });
})();
