import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    // 這裡是你部署後的 Web App URL
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqhqxLgbQFKzuuKesAxOzv4WCOxfll4VH3zyN2QPiqrqIOlUPS5_VPoMn_VukY_6Ip/exec';

    const sheetResponse = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // 注意：GAS 有時對 JSON header 比較挑剔，用 text/plain 反而更穩
      },
      body: JSON.stringify(data),
      redirect: 'follow' // 強制追蹤重新導向
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      throw new Error(`Google Script 回傳錯誤: ${sheetResponse.status} ${errorText}`);
    }

    const result = await sheetResponse.json();

    return json(result); // 使用 SvelteKit 內建的 json helper 更簡潔

  } catch (err: any) {
    console.error('後端轉發失敗:', err);
    return json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
};