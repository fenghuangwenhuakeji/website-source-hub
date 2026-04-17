import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { RowDataPacket } from 'mysql2/promise';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const { status, genre } = req.query;

    let sql = 'SELECT * FROM novels WHERE is_published = 1';
    const params: (string | number)[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status as string);
    }

    if (genre) {
      sql += ' AND genre = ?';
      params.push(genre as string);
    }

    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const novels = await db.query<RowDataPacket[]>(sql, params);

    const countResult = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM novels WHERE is_published = 1` +
      (status ? ' AND status = ?' : '') +
      (genre ? ' AND genre = ?' : ''),
      status ? (genre ? [status, genre] as any : [status] as any) : (genre ? [genre] as any : [])
    );

    res.json({
      success: true,
      data: {
        novels: novels.map(novel => ({
          id: (novel as any).id,
          title: (novel as any).title,
          coverUrl: (novel as any).cover_url,
          description: (novel as any).description,
          genre: (novel as any).genre,
          status: (novel as any).status,
          wordCount: (novel as any).word_count,
          viewCount: (novel as any).view_count,
          likeCount: (novel as any).like_count,
          chapterCount: (novel as any).chapter_count,
          createdAt: (novel as any).created_at,
          updatedAt: (novel as any).updated_at,
        })),
        pagination: {
          page,
          pageSize,
          total: countResult[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;

    const novels = await db.query<RowDataPacket[]>(
      'SELECT * FROM novels WHERE author_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: {
        novels: novels.map(novel => ({
          id: (novel as any).id,
          title: (novel as any).title,
          coverUrl: (novel as any).cover_url,
          description: (novel as any).description,
          genre: (novel as any).genre,
          tags: (novel as any).tags ? JSON.parse((novel as any).tags) : [],
          status: (novel as any).status,
          wordCount: (novel as any).word_count,
          viewCount: (novel as any).view_count,
          likeCount: (novel as any).like_count,
          chapterCount: (novel as any).chapter_count,
          isPublished: (novel as any).is_published,
          createdAt: (novel as any).created_at,
          updatedAt: (novel as any).updated_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const novels = await db.query<RowDataPacket[]>(
      'SELECT * FROM novels WHERE id = ?',
      [id]
    );

    if (novels.length === 0) {
      throw ApiError.notFound('作品不存在');
    }

    const novel = novels[0];

    await db.execute('UPDATE novels SET view_count = view_count + 1 WHERE id = ?', [id]);

    const chapters = await db.query<RowDataPacket[]>(
      'SELECT id, chapter_number, title, word_count, status, created_at FROM chapters WHERE novel_id = ? AND status = ? ORDER BY chapter_number',
      [id, 'published']
    );

    res.json({
      success: true,
      data: {
        novel: {
          id: (novel as any).id,
          title: (novel as any).title,
          coverUrl: (novel as any).cover_url,
          description: (novel as any).description,
          genre: (novel as any).genre,
          tags: (novel as any).tags ? JSON.parse((novel as any).tags) : [],
          status: (novel as any).status,
          wordCount: (novel as any).word_count,
          viewCount: ((novel as any).view_count || 0) + 1,
          likeCount: (novel as any).like_count,
          chapterCount: (novel as any).chapter_count,
          isPublished: (novel as any).is_published,
          createdAt: (novel as any).created_at,
          updatedAt: (novel as any).updated_at,
        },
        chapters: chapters.map(ch => ({
          id: (ch as any).id,
          chapterNumber: (ch as any).chapter_number,
          title: (ch as any).title,
          wordCount: (ch as any).word_count,
          status: (ch as any).status,
          createdAt: (ch as any).created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { title, description, genre, cover_url, tags } = req.body;

    if (!title || title.length < 1) {
      throw ApiError.badRequest('作品名称不能为空');
    }

    const result = await db.execute(
      `INSERT INTO novels (author_id, title, description, genre, cover_url, tags, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'ongoing', NOW())`,
      [userId, title, description || '', genre || '', cover_url || null, tags ? JSON.stringify(tags) : null]
    );

    res.status(201).json({
      success: true,
      data: {
        novel: {
          id: result.insertId,
          title,
          description,
          genre,
          coverUrl: cover_url,
          tags,
          status: 'ongoing',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { id } = req.params;
    const { title, description, genre, cover_url, tags, status } = req.body;

    const novels = await db.query<RowDataPacket[]>(
      'SELECT * FROM novels WHERE id = ? AND author_id = ?',
      [id, userId]
    );

    if (novels.length === 0) {
      throw ApiError.notFound('作品不存在或无权限');
    }

    await db.execute(
      `UPDATE novels SET title = ?, description = ?, genre = ?, cover_url = ?, tags = ?, status = ? WHERE id = ?`,
      [title, description, genre, cover_url, tags ? JSON.stringify(tags) : null, status, id]
    );

    res.json({
      success: true,
      message: '作品更新成功',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { id } = req.params;

    const novels = await db.query<RowDataPacket[]>(
      'SELECT * FROM novels WHERE id = ? AND author_id = ?',
      [id, userId]
    );

    if (novels.length === 0) {
      throw ApiError.notFound('作品不存在或无权限');
    }

    await db.execute('DELETE FROM novels WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '作品删除成功',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/chapters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const chapters = await db.query<RowDataPacket[]>(
      'SELECT * FROM chapters WHERE novel_id = ? AND status = ? ORDER BY chapter_number',
      [id, 'published']
    );

    res.json({
      success: true,
      data: {
        chapters: chapters.map(ch => ({
          id: (ch as any).id,
          chapterNumber: (ch as any).chapter_number,
          title: (ch as any).title,
          content: (ch as any).content,
          wordCount: (ch as any).word_count,
          status: (ch as any).status,
          createdAt: (ch as any).created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/chapters', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { id } = req.params;
    const { title, content, status } = req.body;

    const novels = await db.query<RowDataPacket[]>(
      'SELECT * FROM novels WHERE id = ? AND author_id = ?',
      [id, userId]
    );

    if (novels.length === 0) {
      throw ApiError.notFound('作品不存在或无权限');
    }

    const countResult = await db.query<RowDataPacket[]>(
      'SELECT MAX(chapter_number) as maxChapter FROM chapters WHERE novel_id = ?',
      [id]
    );

    const nextChapterNumber = ((countResult[0] as any)?.maxChapter || 0) + 1;
    const wordCount = content ? content.trim().length : 0;

    const result = await db.execute(
      `INSERT INTO chapters (novel_id, chapter_number, title, content, word_count, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, nextChapterNumber, title, content, wordCount, status || 'draft']
    );

    if (status === 'published') {
      await db.execute(
        `UPDATE novels SET chapter_count = chapter_count + 1, word_count = word_count + ?, updated_at = NOW() WHERE id = ?`,
        [wordCount, id]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        chapter: {
          id: result.insertId,
          chapterNumber: nextChapterNumber,
          title,
          wordCount,
          status: status || 'draft',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/chapters/:chapterId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, chapterId } = req.params;

    const chapters = await db.query<RowDataPacket[]>(
      'SELECT * FROM chapters WHERE id = ? AND novel_id = ?',
      [chapterId, id]
    );

    if (chapters.length === 0) {
      throw ApiError.notFound('章节不存在');
    }

    const chapter = chapters[0];

    await db.execute('UPDATE chapters SET view_count = view_count + 1 WHERE id = ?', [chapterId]);

    res.json({
      success: true,
      data: {
        chapter: {
          id: (chapter as any).id,
          chapterNumber: (chapter as any).chapter_number,
          title: (chapter as any).title,
          content: (chapter as any).content,
          wordCount: (chapter as any).word_count,
          status: (chapter as any).status,
          createdAt: (chapter as any).created_at,
          updatedAt: (chapter as any).updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/chapters/:chapterId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { id, chapterId } = req.params;
    const { title, content, status } = req.body;

    const novels = await db.query<RowDataPacket[]>(
      'SELECT * FROM novels WHERE id = ? AND author_id = ?',
      [id, userId]
    );

    if (novels.length === 0) {
      throw ApiError.notFound('作品不存在或无权限');
    }

    const chapters = await db.query<RowDataPacket[]>(
      'SELECT * FROM chapters WHERE id = ? AND novel_id = ?',
      [chapterId, id]
    );

    if (chapters.length === 0) {
      throw ApiError.notFound('章节不存在');
    }

    const oldChapter = chapters[0] as any;
    const wordCount = content ? content.trim().length : 0;

    await db.execute(
      `UPDATE chapters SET title = ?, content = ?, word_count = ?, status = ? WHERE id = ?`,
      [title, content, wordCount, status, chapterId]
    );

    if (status === 'published' && oldChapter.status !== 'published') {
      await db.execute(
        `UPDATE novels SET chapter_count = chapter_count + 1, word_count = word_count + ?, updated_at = NOW() WHERE id = ?`,
        [wordCount, id]
      );
    }

    res.json({
      success: true,
      message: '章节更新成功',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
