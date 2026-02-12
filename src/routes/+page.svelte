<script lang="ts">
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import liff from '@line/liff';


  let form = {
    name: '',
    gender: '先生',
    phone: '',
    quantity: 1,
    delivery: '自取',
    date: '',
    time: '',        // ⭐ 新增：時段欄位
    address: '',
    userId:''
  };

  const showConfirm = writable(false);
  const showComplete = writable(false);
  let submittedOrder: typeof form = { ...form };
  let availableDates: string[] = [];
  const availableTimes = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]; // ⭐ 時段選項

  // 日期範圍 +2~10 天
  onMount(async () => {
    await liff.init({ liffId: "2009093660-GlErhHvm" });
    if (!liff.isLoggedIn()) {
      liff.login(); // 如果沒登入會跳到 LINE 登入頁
    }
    const profile = await liff.getProfile();
    form.userId = profile.userId;   // ⭐ 這個非常重要
    
    const today = new Date();
    const min = new Date(today);

    min.setDate(min.getDate() + 2);
    const max = new Date(today);
    max.setDate(max.getDate() + 10);

    const dates: string[] = [];
    const cur = new Date(min);
    while (cur <= max) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    availableDates = dates;
  });

  function validPhone(phone: string) {
    const mobile = /^09\d{8}$/;
    const landline = /^0\d{1,2}-\d{6,8}$/;
    return mobile.test(phone) || landline.test(phone);
  }

  function submitForm() {
    if (!form.name) return alert('請輸入姓名');
    if (!validPhone(form.phone)) return alert('電話格式錯誤');
    if (!form.date) return alert('請選擇日期');
    if (!form.time) return alert('請選擇時段'); // ⭐ 新增時段驗證

    if (form.delivery === '外送' && form.quantity < 10) {
      alert('外送需滿10盒，已自動改為自取');
      form.delivery = '自取';
      return;
    }
    if (form.delivery === '外送' && !form.address) return alert('請輸入外送地址');

    submittedOrder = { ...form };
    showConfirm.set(true);
  }

  async function confirmOrder() {
    showConfirm.set(false);

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await res.json();

      if (result.success === true || result.status === 'success') {
        showComplete.set(true);
      } else {
        alert('送出失敗：' + result.message);
      }
    } catch (err: any) {
      alert('送出失敗，請稍後再試');
      console.error(err);
    }
  }

  function modifyOrder() {
    showConfirm.set(false);
  }
</script>

<div class="min-h-screen flex flex-col items-center p-4 bg-[#F1E1FF]">
  <img src="/h.png" alt="Banner" class="w-full max-h-64 object-cover rounded-md mb-6">

  <div class="w-full max-w-md bg-white p-6 rounded-lg shadow-md space-y-5 text-xl">
    <h2 class="text-3xl font-bold mb-4">訂購資訊</h2>

    <!-- 姓名 -->
    <div>
      <label class="block font-semibold mb-2">姓名</label>
      <input type="text" bind:value={form.name} placeholder="請輸入姓名" class="w-full border rounded-lg p-4 text-xl">
    </div>

    <!-- 性別 -->
    <div class="flex gap-6 items-center text-xl">
      <label class="font-semibold">性別</label>
      <label class="flex items-center gap-2"><input type="radio" bind:group={form.gender} value="先生"> 先生</label>
      <label class="flex items-center gap-2"><input type="radio" bind:group={form.gender} value="小姐"> 小姐</label>
    </div>

    <!-- 電話 -->
    <div>
      <label class="block font-semibold mb-2">電話</label>
      <input type="text" bind:value={form.phone} placeholder="ex: 0916717797 或 02-26081202" class="w-full border rounded-lg p-4 text-xl">
    </div>

    <!-- 訂購數量 -->
    <label class="block font-semibold mb-2">數量</label>
    <div class="flex items-center gap-2 w-full">
      <button type="button" on:click={() => form.quantity = Math.max(1, form.quantity - 1)} class="bg-gray-300 text-2xl px-4 rounded-lg hover:bg-gray-400 h-14 w-14 flex items-center justify-center">−</button>
      <input type="text" min="1" bind:value={form.quantity} class="border rounded-lg p-4 text-xl text-center h-14 flex-1 max-w-46 box-border appearance-none" inputmode="numeric" />
      <button type="button" on:click={() => form.quantity = form.quantity + 1} class="bg-gray-300 text-2xl px-4 rounded-lg hover:bg-gray-400 h-14 w-14 flex items-center justify-center">+</button>
    </div>

    <!-- 自取/外送 -->
    <div>
      <label class="block font-semibold mb-2">取貨（滿5盒可外送:限林口、龜山）</label>
      <select bind:value={form.delivery} class="w-full border rounded-lg p-4 text-xl">
        {#if form.quantity >= 10}
          <option value="自取">自取:文化二路68巷2號</option>
          <option value="外送">外送</option>
        {:else}
          <option value="自取">自取</option>
        {/if}
      </select>
    </div>

    <!-- 外送地址 -->
    {#if form.delivery === '外送'}
      <div>
        <label class="block font-semibold mb-2">外送地址</label>
        <input type="text" bind:value={form.address} placeholder="請輸入收貨地址" class="w-full border rounded-lg p-4 text-xl">
      </div>
    {/if}

    <!-- 日期 -->
    <div>
      <label class="block font-semibold mb-2">選擇{form.delivery}日期</label>
      <select bind:value={form.date} class="w-full border rounded-lg p-4 text-xl">
        <option value="" disabled selected>請選擇日期</option>
        {#each availableDates as d}
          <option value={d}>{d}</option>
        {/each}
      </select>
    </div>

    <!-- 時段 -->
    <div>
      <label class="block font-semibold mb-2">選擇{form.delivery}時段</label>
      <select bind:value={form.time} class="w-full border rounded-lg p-4 text-xl">
        <option value="" disabled selected>請選擇時段</option>
        {#each availableTimes as t}
          <option value={t}>{t}</option>
        {/each}
      </select>
    </div>

    <!-- 商品圖片 -->
    <div>
      <img src="/contact.jpg" alt="contact" class="w-full max-h-96 object-contain rounded-md">
      <img src="/real.jpeg" alt="商品圖" class="w-full max-h-96 object-contain rounded-md">
    </div>

    <!-- 送出 -->
    <button on:click={submitForm} class="bg-blue-500 text-white px-6 py-4 rounded-lg hover:bg-blue-600 w-full">
      送出訂單
    </button>
  </div>
</div>

<!-- 訂單確認 overlay -->
{#if $showConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
      <h2 class="text-2xl font-bold">請確認訂單資訊</h2>
      <ul class="text-xl space-y-1">
        <li>姓名：{submittedOrder.name}</li>
        <li>性別：{submittedOrder.gender}</li>
        <li>電話：{submittedOrder.phone}</li>
        <li>數量：{submittedOrder.quantity}</li>
        <li>取貨：{submittedOrder.delivery}</li>
        {#if submittedOrder.delivery === '外送'}
          <li>地址：{submittedOrder.address}</li>
        {/if}
        <li>日期：{submittedOrder.date}</li>
        <li>時段：{submittedOrder.time}</li> <!-- ⭐ 新增顯示時段 -->
      </ul>
      <div class="flex flex-col sm:flex-row justify-center gap-3">
        <button on:click={modifyOrder} class="bg-gray-300 px-6 py-3 rounded-lg hover:bg-gray-400 w-full sm:w-auto text-xl">修改</button>
        <button on:click={confirmOrder} class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 w-full sm:w-auto text-xl">確認送出</button>
      </div>
    </div>
  </div>
{/if}

<!-- 訂單完成 overlay -->
{#if $showComplete}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center space-y-3 text-xl">
      <h2 class="text-2xl font-bold">訂單已完成！</h2>
      <p>感謝您的訂購 🎉</p>
      <img src="/IMG_3119.jpeg" alt="thanks" class="w-full max-h-96 object-contain rounded-md">
      <button on:click={() => showComplete.set(false)} class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 w-full text-xl">關閉</button>
    </div>
  </div>
{/if}
