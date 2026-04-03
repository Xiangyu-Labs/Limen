import OpenAI from 'openai';
import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface AIResponse {
  title: string;
  summary: string;
  tags: string[];
}

async function getExistingTags(database: typeof db) {
  const rows = await database.query.entries.findMany({
    columns: {
      tags: true,
    },
  });

  const tags = new Set<string>();
  for (const row of rows) {
    if (!row.tags) continue;
    try {
      for (const tag of JSON.parse(row.tags) as string[]) {
        if (tag) tags.add(tag);
      }
    } catch {}
  }
  return Array.from(tags).sort();
}

type ProcessorDeps = {
  db: typeof db;
  client: {
    chat: {
      completions: {
        create: (...args: any[]) => Promise<{
          choices: { message: { content: string | null } }[];
        }>;
      };
    };
  };
  model?: string;
};

function createOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
  });
}

export function createAIProcessor({
  db: database,
  client,
  model = process.env.AI_MODEL || 'gpt-4o-mini',
}: ProcessorDeps) {
  return async function processAIEntry(entryId: string, content: string) {
    try {
      const existingTags = await getExistingTags(database);
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `你是一个帮助我整理日记记录的助手。\n请严格遵守以下规则：\n1. title 和 summary 必须使用第一人称“我”的视角来描述，不要写成“作者说了”这类旁观者口吻。\n2. title 要短，抓核心，不要过长。\n3. tags 优先复用已有标签；只有在确实不合适时才创建新标签。\n4. tags 最多 10 个，但不是越多越好，按内容自然生成。\n5. Respond ONLY in JSON format with keys: "title", "summary", "tags".\n现有标签候选：${existingTags.join(', ') || '无'}`,
          },
          {
            role: 'user',
            content,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const aiResult = JSON.parse(response.choices[0].message.content || '{}') as AIResponse;

      await database.update(entries)
        .set({
          title: aiResult.title,
          summary: aiResult.summary,
          tags: JSON.stringify(aiResult.tags),
          aiStatus: 'done',
          updatedAt: new Date(),
        })
        .where(eq(entries.id, entryId));
    } catch (error) {
      console.error(`AI processing failed for entry ${entryId}:`, error);
      await database.update(entries)
        .set({
          aiStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(entries.id, entryId));
    }
  };
}

export async function processAIEntry(entryId: string, content: string) {
  const processor = createAIProcessor({
    db,
    client: createOpenAIClient(),
  });

  return processor(entryId, content);
}
