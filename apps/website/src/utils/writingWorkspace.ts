import type { WritingChapter, WritingProject } from '../types/writing';
import { countProjectChapters, countProjectWords } from './localWriting';
import { WRITING_TYPE_META } from './writingMetadata';

function extractTail(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return '正文还没有开始，可以先用一句清晰的目标把人物推上舞台。';
  }

  const fragments = trimmed.split(/[\n。！？!?]/).map((item) => item.trim()).filter(Boolean);
  return fragments[fragments.length - 1] || trimmed.slice(-36);
}

export function createAssistantSuggestions(project: WritingProject, chapter: WritingChapter) {
  const meta = WRITING_TYPE_META[project.type];
  const tail = extractTail(chapter.content);

  const bodies = {
    novel: [
      `围绕“${chapter.summary || project.premise}”安排一个能让人物付出代价的障碍。`,
      `把世界规则写进人物动作，而不是只放在说明里。可从这句往下接：“${tail}”。`,
      '章末最好留下一个必须追下一章的问题，比如误判、反噬或新线索。',
    ],
    script: [
      `这场戏里至少有一方要明确想得到什么，并且不断逼近“${chapter.summary || project.premise}”。`,
      '删掉解释型对白，把说明改成追问、停顿和打断，让冲突自己说话。',
      `场景结尾最好留一个可直接切到下一场的动作或物件，承接“${tail}”。`,
    ],
    comic: [
      '这一话至少准备一个翻页爆点，让读者在最后两格才看清真正的问题。',
      `优先把“${chapter.summary || project.premise}”拆成可被看见的动作、表情和视线关系。`,
      '给主角一个高辨识度动作习惯，条漫连载时会更稳。',
    ],
    storyboard: [
      '别让每个镜头长度都一样，开场稍慢，信息确认后立刻提速。',
      '每组镜头最好分别承担交代空间、确认人物和释放风险三个任务。',
      `从“${tail}”切向更近、更硬的画面，例如灯牌、脚步或反光中的追兵。`,
    ],
  }[project.type];

  return bodies.map((body, index) => ({
    title: `${meta.assistantTitle} ${index + 1}`,
    body,
  }));
}

export function createProjectChecklist(project: WritingProject) {
  return [
    {
      label: '封面、简介与标签',
      done: Boolean(project.coverImage || project.description || project.tags.length > 0),
    },
    {
      label: '世界观与规则边界',
      done: Boolean(project.worldview.trim()),
    },
    {
      label: '导入大纲并拆结构',
      done: Boolean(project.outline.trim()) && countProjectChapters(project) > 1,
    },
    {
      label: '素材库完成首轮沉淀',
      done: project.materials.length >= 3,
    },
    {
      label: '正文持续推进',
      done: countProjectWords(project) >= 200,
    },
  ];
}
