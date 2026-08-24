import { getAllCheckinsWithHabitInfo, getSetting } from '../database/queries.js';

const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

/**
 * Verify Notion API credentials and check if the Database is accessible
 * @param {string} token - Notion Internal Integration Token (secret_...)
 * @param {string} databaseId - 32-character Notion Database ID
 * @returns {Promise<{success: boolean, message: string, databaseTitle?: string}>}
 */
export async function testNotionConnection(token, databaseId) {
  if (!token || !databaseId) {
    return { success: false, message: 'Vui lòng nhập đầy đủ Token và Database ID.' };
  }

  const cleanDatabaseId = databaseId.replace(/-/g, '');

  try {
    const response = await fetch(`${NOTION_BASE_URL}/databases/${cleanDatabaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Lỗi Notion API (${response.status}): Không thể kết nối.`,
      };
    }

    const title = data.title && data.title[0] ? data.title[0].plain_text : 'Database';
    return {
      success: true,
      message: `Kết nối thành công tới Database: "${title}"`,
      databaseTitle: title,
    };
  } catch (error) {
    return {
      success: false,
      message: `Lỗi kết nối mạng: ${error.message}`,
    };
  }
}

/**
 * Build the Notion Page payload JSON from a SQLite checkin record
 */
function buildNotionPagePayload(databaseId, checkin) {
  const cleanDatabaseId = databaseId.replace(/-/g, '');
  const habitTypeLabel = checkin.habit_type === 'build' ? 'Build' : 'Quit';
  const statusLabel = checkin.status === 'completed' ? 'Completed' : (checkin.status === 'frozen' ? 'Frozen' : 'Failed');
  const pageTitle = `[${checkin.habit_title}] Ngày ${checkin.day_number} (${checkin.checkin_date})`;

  const childrenBlocks = [];

  if (checkin.note && checkin.note.trim()) {
    childrenBlocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: { content: checkin.habit_type === 'quit' ? '🛡️ Nhật Ký Phản Tư (Quit Habit)' : '📝 Ghi Chú Kỷ Luật' }
          }
        ]
      }
    });

    childrenBlocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: checkin.note.trim() }
          }
        ]
      }
    });
  } else {
    childrenBlocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: `Điểm danh thành công ngày ${checkin.checkin_date}.` }
          }
        ]
      }
    });
  }

  return {
    parent: { database_id: cleanDatabaseId },
    properties: {
      Name: {
        title: [
          {
            text: { content: pageTitle }
          }
        ]
      }
    },
    children: childrenBlocks
  };
}

/**
 * Sync SQLite check-ins and reflections directly to Notion Workspace
 * @param {object} [options]
 * @param {function} [options.onProgress] - (current, total, itemInfo) => void
 * @returns {Promise<{success: boolean, syncedCount: number, errorCount: number, errors: string[]}>}
 */
export async function syncCheckinsToNotion({ onProgress } = {}) {
  const token = await getSetting('notion_token');
  const databaseId = await getSetting('notion_database_id');

  if (!token || !databaseId) {
    throw new Error('Chưa cấu hình Notion Integration Token hoặc Database ID trong Cài đặt.');
  }

  // Fetch checkins with notes or completed status
  const checkins = await getAllCheckinsWithHabitInfo();
  
  if (!checkins || checkins.length === 0) {
    return { success: true, syncedCount: 0, errorCount: 0, errors: [] };
  }

  let syncedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < checkins.length; i++) {
    const item = checkins[i];
    
    if (onProgress) {
      onProgress(i + 1, checkins.length, `${item.habit_title} - Ngày ${item.day_number}`);
    }

    const payload = buildNotionPagePayload(databaseId, item);

    try {
      const response = await fetch(`${NOTION_BASE_URL}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        errorCount++;
        errors.push(`[${item.habit_title} ${item.checkin_date}]: ${errData.message || response.statusText}`);
      } else {
        syncedCount++;
      }
    } catch (err) {
      errorCount++;
      errors.push(`[${item.habit_title} ${item.checkin_date}]: ${err.message}`);
    }

    // Small delay to respect Notion rate limits (3 requests per second)
    await new Promise(res => setTimeout(res, 350));
  }

  return {
    success: errorCount === 0,
    syncedCount,
    errorCount,
    errors
  };
}
