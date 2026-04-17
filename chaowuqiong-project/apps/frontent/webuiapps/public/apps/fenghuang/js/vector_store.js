// =================================================================
// SECTION: Vector Store Logic
// =================================================================

const VECTOR_STORE_NAME = 'vector_store';

/**
 * Calls the embedding model API.
 * @param {string} text - The text to embed.
 * @returns {Promise<Array<number>>} - The embedding vector.
 */
async function getEmbedding(text) {
    console.log(`Requesting embedding for: "${text.substring(0, 30)}..."`);
    try {
        const vector = await callEmbeddingAPI(text);
        return vector;
    } catch (error) {
        showNotification(`文本嵌入失败: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Adds a text chunk and its vector to the vector store for a specific project.
 * @param {number} projectId - The ID of the current project.
 * @param {string} text - The original text content.
 * @param {Array<number>} vector - The embedding vector.
 * @returns {Promise<number>} - The ID of the newly stored item.
 */
async function addToVectorStore(projectId, text, vector) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VECTOR_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(VECTOR_STORE_NAME);
        const request = store.add({ projectId, text, vector });

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Failed to add to vector store: ' + event.target.error);
    });
}

/**
 * Retrieves all vector items for a given project.
 * @param {number} projectId - The ID of the project.
 * @returns {Promise<Array<object>>} - An array of items from the vector store.
 */
async function getProjectVectors(projectId) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VECTOR_STORE_NAME], 'readonly');
        const store = transaction.objectStore(VECTOR_STORE_NAME);
        const index = store.index('projectId');
        const request = index.getAll(projectId);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Failed to get project vectors: ' + event.target.error);
    });
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param {Array<number>} vecA 
 * @param {Array<number>} vecB 
 * @returns {number} - The cosine similarity score.
 */
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }
    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Searches the vector store for the most similar items to a query text.
 * @param {number} projectId - The ID of the current project.
 * @param {string} queryText - The text to search for.
 * @param {number} topN - The number of top results to return.
 * @returns {Promise<Array<object>>} - An array of the most similar items, with a 'similarity' score.
 */
async function searchVectorStore(projectId, queryText, topN = 5) {
    if (!queryText.trim()) return [];

    const queryVector = await getEmbedding(queryText);
    const projectVectors = await getProjectVectors(projectId);

    if (projectVectors.length === 0) return [];

    const scoredVectors = projectVectors.map(item => ({
        ...item,
        similarity: cosineSimilarity(queryVector, item.vector)
    }));

    scoredVectors.sort((a, b) => b.similarity - a.similarity);

    return scoredVectors.slice(0, topN);
}

/**
 * Processes a large text (like a knowledge base file) into chunks and adds them to the vector store.
 * @param {number} projectId - The ID of the current project.
 * @param {string} largeText - The full text to process.
 */
async function processAndStoreKnowledgeBase(projectId, largeText) {
    // Simple chunking strategy: split by paragraphs.
    const chunks = largeText.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 50); // Filter out very short chunks
    
    showNotification(`开始处理知识库，共 ${chunks.length} 个片段...`, 'info');

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const vector = await getEmbedding(chunk);
            await addToVectorStore(projectId, chunk, vector);
            console.log(`Stored chunk ${i + 1}/${chunks.length}`);
        } catch (error) {
            console.error(`Failed to process chunk ${i + 1}:`, error);
            showNotification(`处理片段 ${i + 1} 失败。`, 'error');
        }
    }
    showNotification('知识库处理完成！', 'success');
}