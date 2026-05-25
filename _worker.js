// ============================================================
// 外贸独立站 - Cloudflare Worker (修复后台菜单点击问题)
// 功能：动态配置、产品/博客管理、询盘收集、SEO友好、真实后台
// 存储：Workers KV (绑定名 MY_KV)
// 环境变量：ADMIN_PASSWORD (管理后台密码)
// ============================================================

// ----- 默认配置（首次运行时自动初始化）-----
const DEFAULT_CONFIG = {
  site_title: "GlobalTrade Pro - 专业外贸供应商",
  site_keywords: "外贸, 定制产品, 批发, 高品质制造, OEM",
  site_description: "GlobalTrade Pro 提供高品质工业零件与消费电子, 服务全球100+国家客户。",
  company_name: "GlobalTrade Pro Ltd.",
  logo_url: "https://placehold.co/200x60/1e293b/white?text=GlobalTrade",
  email: "sales@globaltrade.com",
  phone: "+1 234 567 8900",
  address: "123 Business Blvd, Suite 100, New York, USA",
  whatsapp_link: "https://wa.me/12345678900",
  social_links: [
    { platform: "facebook", url: "https://facebook.com/globaltrade" },
    { platform: "twitter", url: "https://twitter.com/globaltrade" },
    { platform: "instagram", url: "https://instagram.com/globaltrade" },
    { platform: "linkedin", url: "https://linkedin.com/company/globaltrade" },
    { platform: "youtube", url: "https://youtube.com/globaltrade" },
    { platform: "pinterest", url: "https://pinterest.com/globaltrade" },
    { platform: "tiktok", url: "https://tiktok.com/@globaltrade" }
  ],
  hero: {
    h1: "高品质定制产品, 助力全球业务增长",
    subtitle: "10年OEM/ODM经验, 快速打样, 严格质检, 一站式供应链解决方案",
    cta_text: "获取免费报价",
    cta_link: "/contact",
    image_url: "https://placehold.co/1200x600/0f172a/white?text=Manufacturing+Excellence"
  },
  trust_signals: {
    testimonials: [
      { name: "John Carter", position: "采购总监, EuroTech", rating: 5, text: "质量可靠, 交货准时, 强力推荐！", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
      { name: "Lisa Wang", position: "CEO, GreenFuture", rating: 5, text: "专业团队, 解决了我们的定制难题, 合作愉快。", avatar: "https://randomuser.me/api/portraits/women/2.jpg" }
    ],
    media_logos: [
      { name: "Industry Weekly", logo: "https://placehold.co/100x50/e2e8f0/1e293b?text=Industry+Weekly" },
      { name: "Export Today", logo: "https://placehold.co/100x50/e2e8f0/1e293b?text=Export+Today" }
    ],
    customers_count: "5000+ 全球客户",
    security_badges: ["SSL加密", "支付安全", "ISO9001认证"]
  },
  body_content: {
    problem_title: "传统采购痛点: 质量不稳、交期拖延、沟通困难",
    problem_desc: "我们深知跨国采购的挑战, 从产品开发到物流, 每一个环节都可能出现问题。",
    solution_title: "一站式智能制造解决方案",
    solution_desc: "自有工厂+严苛品控+专业外贸团队, 让您省心省力获得高品质产品。",
    features: [
      { icon: "fa-solid fa-microchip", title: "先进设备", desc: "全自动生产线, 精度达0.01mm" },
      { icon: "fa-solid fa-clock", title: "快速打样", desc: "7天交付首样, 缩短上市周期" },
      { icon: "fa-solid fa-chart-line", title: "灵活MOQ", desc: "小批量起订, 支持试单" },
      { icon: "fa-solid fa-globe", title: "全球物流", desc: "海陆空专线, 门到门服务" }
    ],
    benefits: "降低30%采购成本, 缩短20%交货时间, 100%质检保障"
  },
  solution_section: {
    title: "我们的解决方案",
    subtitle: "针对不同行业需求，提供全方位定制服务",
    blocks: [
      { icon: "fa-solid fa-industry", title: "工业零件", desc: "精密CNC加工，压铸，注塑，满足高公差要求" },
      { icon: "fa-solid fa-mobile-alt", title: "消费电子", desc: "PCBA代工，外壳设计，成品组装，一站式交付" },
      { icon: "fa-solid fa-box", title: "包装定制", desc: "环保材料，品牌专属设计，提升产品附加值" },
      { icon: "fa-solid fa-truck-fast", title: "物流仓储", desc: "全球海外仓，一件代发，降低库存风险" }
    ]
  },
  secondary_cta: {
    text: "立即询盘, 获取专属方案及样品",
    button_text: "联系销售团队",
    button_link: "/contact"
  },
  footer_links: [
    { text: "隐私政策", url: "/privacy" },
    { text: "服务条款", url: "/terms" }
  ],
  about_content: "GlobalTrade Pro 成立于2014年, 专注于为全球中小型企业提供精密零部件及消费电子定制服务。我们拥有ISO9001认证工厂和一支经验丰富的工程师团队, 已服务超过5000家客户。使命是降低跨境采购门槛, 用中国智造助力全球创新。",
  privacy_content: "我们非常重视您的隐私。本政策说明我们如何收集、使用和保护您的个人信息。当您使用本网站时，即表示同意我们按照本政策处理您的信息。我们仅收集必要的姓名、邮箱和询盘内容，绝不泄露给第三方。更多详情请联系我们的数据保护官。",
  terms_content: "使用本网站即表示您同意遵守以下条款：所有内容仅供参考，产品价格和规格可能随时更改。我们保留拒绝服务或取消订单的权利。您不得滥用本网站进行非法活动。如有争议，适用美国加州法律。"
};

// ----- KV 操作辅助函数 (带错误处理)-----
async function getConfig(kv) {
  try {
    let config = await kv.get("site_config", "json");
    if (!config) {
      await kv.put("site_config", JSON.stringify(DEFAULT_CONFIG));
      config = DEFAULT_CONFIG;
    }
    return config;
  } catch (e) {
    console.error("getConfig error", e);
    return DEFAULT_CONFIG;
  }
}
async function getProducts(kv) { return (await kv.get("products", "json")) || []; }
async function getBlogs(kv) { return (await kv.get("blogs", "json")) || []; }
async function getInquiries(kv) { return (await kv.get("inquiries", "json")) || []; }
async function getSubscribers(kv) { return (await kv.get("subscribers", "json")) || []; }
async function saveProducts(kv, data) { await kv.put("products", JSON.stringify(data)); }
async function saveBlogs(kv, data) { await kv.put("blogs", JSON.stringify(data)); }
async function saveInquiries(kv, data) { await kv.put("inquiries", JSON.stringify(data)); }
async function saveSubscribers(kv, data) { await kv.put("subscribers", JSON.stringify(data)); }
async function saveConfig(kv, config) { await kv.put("site_config", JSON.stringify(config)); }

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ----- 公共头部渲染（双层结构）-----
function renderHeader(config, active = "") {
  const socialIcons = (config.social_links || []).map(s => `<a href="${s.url}" target="_blank" class="text-gray-500 hover:text-orange-500 transition mx-1"><i class="fab fa-${s.platform}"></i></a>`).join('');
  return `
    <header>
      <div class="bg-gray-100 text-sm py-2">
        <div class="container mx-auto px-4 flex justify-between items-center">
          <div class="flex space-x-3">${socialIcons}</div>
          <div class="flex space-x-4">
            <a href="mailto:${config.email}" class="text-gray-600 hover:text-orange-500"><i class="fas fa-envelope mr-1"></i> ${config.email}</a>
            <a href="${config.whatsapp_link}" target="_blank" class="text-green-600 hover:text-green-700"><i class="fab fa-whatsapp mr-1"></i> WhatsApp</a>
          </div>
        </div>
      </div>
      <div class="bg-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between">
          <div class="flex items-center">
            <img src="${config.logo_url}" alt="${config.company_name}" class="h-12 w-auto">
          </div>
          <nav class="hidden md:flex space-x-6 text-gray-700 font-medium">
            <a href="/" class="hover:text-orange-500 ${active === 'home' ? 'text-orange-600' : ''}">首页</a>
            <a href="/products" class="hover:text-orange-500 ${active === 'products' ? 'text-orange-600' : ''}">产品</a>
            <a href="/solutions" class="hover:text-orange-500 ${active === 'solutions' ? 'text-orange-600' : ''}">解决方案</a>
            <a href="/about" class="hover:text-orange-500 ${active === 'about' ? 'text-orange-600' : ''}">关于我们</a>
            <a href="/blog" class="hover:text-orange-500 ${active === 'blog' ? 'text-orange-600' : ''}">资讯</a>
            <a href="/contact" class="hover:text-orange-500 ${active === 'contact' ? 'text-orange-600' : ''}">联系我们</a>
          </nav>
          <div class="relative search-container">
            <i id="searchIcon" class="fas fa-search text-gray-600 text-xl cursor-pointer hover:text-orange-500 transition"></i>
            <div id="searchBox" class="hidden absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-2 z-20">
              <input type="text" id="searchInput" placeholder="搜索产品..." class="w-full border rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400">
            </div>
          </div>
        </div>
      </div>
    </header>
    <script>
      document.getElementById('searchIcon').addEventListener('click', function() {
        const box = document.getElementById('searchBox');
        box.classList.toggle('hidden');
        if (!box.classList.contains('hidden')) document.getElementById('searchInput').focus();
      });
      document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
        if(e.key === 'Enter') {
          let query = this.value.trim();
          if(query) window.location.href = '/products?search=' + encodeURIComponent(query);
        }
      });
    </script>
  `;
}

function renderFooter(config) {
  return `
    <footer class="bg-gray-900 text-gray-300 mt-20">
      <div class="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <img src="${config.logo_url}" alt="${config.company_name}" class="h-10 mb-4">
          <p>${config.company_name}<br>${config.address}</p>
          <p class="mt-2"><i class="fas fa-phone"></i> ${config.phone}<br><i class="fas fa-envelope"></i> ${config.email}</p>
        </div>
        <div>
          <h4 class="text-white font-bold mb-4">快捷链接</h4>
          <ul class="space-y-2">
            <li><a href="/about" class="hover:text-orange-400">关于我们</a></li>
            <li><a href="/products" class="hover:text-orange-400">产品中心</a></li>
            <li><a href="/solutions" class="hover:text-orange-400">解决方案</a></li>
            <li><a href="/blog" class="hover:text-orange-400">博客资讯</a></li>
            <li><a href="/contact" class="hover:text-orange-400">联系我们</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-bold mb-4">关注我们</h4>
          <div class="flex flex-wrap gap-3">
            ${(config.social_links || []).map(s => `<a href="${s.url}" target="_blank" class="text-2xl hover:text-orange-400"><i class="fab fa-${s.platform}"></i></a>`).join('')}
            <a href="${config.whatsapp_link}" target="_blank" class="text-2xl text-green-400 hover:text-green-300"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>
        <div>
          <h4 class="text-white font-bold mb-4">邮件订阅</h4>
          <form id="subscribeForm" class="flex">
            <input type="email" id="subEmail" placeholder="您的邮箱" class="flex-1 p-2 rounded-l text-gray-900" required>
            <button type="submit" class="bg-orange-600 px-4 rounded-r hover:bg-orange-700">订阅</button>
          </form>
          <p class="text-xs mt-2">获取最新产品资讯和优惠</p>
        </div>
      </div>
      <div class="border-t border-gray-800 py-4 text-center text-sm">
        <p>© ${new Date().getFullYear()} ${config.company_name}. 保留所有权利. 
        ${(config.footer_links || []).map(link => `<a href="${link.url}" class="hover:text-orange-400 mx-2">${link.text}</a>`).join('')}
        </p>
      </div>
    </footer>
    <script>
      document.getElementById('subscribeForm')?.addEventListener('submit', async function(e){
        e.preventDefault();
        let email = document.getElementById('subEmail').value;
        let resp = await fetch('/api/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email}) });
        let data = await resp.json();
        alert(data.message);
        if(resp.ok) document.getElementById('subEmail').value = '';
      });
    </script>
  `;
}

function renderHead(config, pageTitle) {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle || config.site_title)}</title>
    <meta name="description" content="${escapeHtml(config.site_description)}">
    <meta name="keywords" content="${escapeHtml(config.site_keywords)}">
    <meta name="robots" content="index, follow">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>
    <style>
      .hover-scale:hover { transform: scale(1.02); transition: 0.2s; }
      .cta-button { background: #f97316; transition: 0.2s; }
      .cta-button:hover { background: #ea580c; transform: translateY(-2px); }
      .hero-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
    </style>
  `;
}

// ----- 页面渲染函数（同之前，无变化）-----
async function renderHome(kv, config) {
  const trust = config.trust_signals;
  const testimonialsHtml = (trust.testimonials || []).map(t => `
    <div class="bg-gray-50 p-5 rounded-lg shadow">
      <div class="flex items-center space-x-3"><img src="${t.avatar}" class="w-12 h-12 rounded-full"><div><p class="font-bold">${escapeHtml(t.name)}</p><p class="text-yellow-500">${'★'.repeat(t.rating)}</p></div></div>
      <p class="mt-2 italic">"${escapeHtml(t.text)}"</p>
    </div>
  `).join('');
  const mediaHtml = (trust.media_logos || []).map(m => `<img src="${m.logo}" alt="${m.name}" class="h-10 object-contain mx-4">`).join('');
  const featuresHtml = (config.body_content.features || []).map(f => `
    <div class="text-center p-4"><i class="${f.icon} text-4xl text-orange-500 mb-2"></i><h3 class="font-bold text-xl">${escapeHtml(f.title)}</h3><p>${escapeHtml(f.desc)}</p></div>
  `).join('');
  const solutionBlocks = (config.solution_section.blocks || []).map(b => `
    <div class="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition">
      <i class="${b.icon} text-5xl text-orange-500 mb-3"></i>
      <h3 class="text-xl font-bold mb-2">${escapeHtml(b.title)}</h3>
      <p class="text-gray-600">${escapeHtml(b.desc)}</p>
    </div>
  `).join('');
  
  return `<!DOCTYPE html>
    <html lang="en">
    <head>${renderHead(config, config.site_title)}</head>
    <body class="bg-gray-50">
      ${renderHeader(config, "home")}
      <main>
        <section class="hero-gradient text-white py-20">
          <div class="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <div class="md:w-1/2">
              <h1 class="text-4xl md:text-5xl font-bold leading-tight">${escapeHtml(config.hero.h1)}</h1>
              <p class="text-xl mt-4 text-gray-200">${escapeHtml(config.hero.subtitle)}</p>
              <a href="${config.hero.cta_link}" class="cta-button inline-block mt-8 text-white font-bold py-3 px-8 rounded-lg shadow-lg">${escapeHtml(config.hero.cta_text)}</a>
            </div>
            <div class="md:w-1/2 mt-8 md:mt-0"><img src="${config.hero.image_url}" alt="Hero" class="rounded-lg shadow-2xl"></div>
          </div>
        </section>
        <section class="py-16 bg-white">
          <div class="container mx-auto px-4">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">${escapeHtml(config.solution_section.title)}</h2>
            <p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">${escapeHtml(config.solution_section.subtitle)}</p>
            <div class="grid md:grid-cols-4 gap-8">${solutionBlocks}</div>
          </div>
        </section>
        <section class="py-12 bg-gray-50">
          <div class="container mx-auto px-4">
            <div class="grid md:grid-cols-2 gap-8">
              <div><h2 class="text-2xl font-bold mb-4">客户评价</h2><div class="grid gap-4">${testimonialsHtml}</div></div>
              <div><h2 class="text-2xl font-bold mb-4">权威认可</h2><div class="flex flex-wrap items-center">${mediaHtml}</div><div class="mt-6"><p class="text-3xl font-bold text-orange-600">${trust.customers_count}</p><p>全球信赖</p><div class="flex mt-2 space-x-2">${(trust.security_badges || []).map(b => `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">${b}</span>`).join('')}</div></div></div>
            </div>
          </div>
        </section>
        <section class="py-12">
          <div class="container mx-auto px-4">
            <div class="bg-white p-8 rounded-xl shadow-md mb-12"><h2 class="text-3xl font-bold text-red-600">⚠️ ${escapeHtml(config.body_content.problem_title)}</h2><p class="mt-2 text-gray-600">${escapeHtml(config.body_content.problem_desc)}</p></div>
            <div class="bg-blue-50 p-8 rounded-xl mb-12"><h2 class="text-3xl font-bold text-blue-800">💡 ${escapeHtml(config.body_content.solution_title)}</h2><p class="mt-2">${escapeHtml(config.body_content.solution_desc)}</p></div>
            <h2 class="text-3xl font-bold text-center mb-8">核心优势</h2>
            <div class="grid md:grid-cols-4 gap-6">${featuresHtml}</div>
            <div class="mt-8 text-center text-lg font-semibold">✨ ${escapeHtml(config.body_content.benefits)}</div>
          </div>
        </section>
        <section class="bg-orange-50 py-16 text-center">
          <div class="container mx-auto px-4"><h3 class="text-3xl font-bold">${escapeHtml(config.secondary_cta.text)}</h3><a href="${config.secondary_cta.button_link}" class="cta-button inline-block mt-6 text-white font-bold py-3 px-8 rounded-lg">${escapeHtml(config.secondary_cta.button_text)}</a></div>
        </section>
      </main>
      ${renderFooter(config)}
    </body>
    </html>`;
}

async function renderProductsPage(kv, config, searchQuery) {
  let products = await getProducts(kv);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }
  const listHtml = products.map(p => `
    <div class="bg-white rounded-lg shadow-md overflow-hidden hover-scale">
      <img src="${p.image_url}" class="h-48 w-full object-cover" alt="${p.name}">
      <div class="p-4"><h3 class="text-xl font-bold">${escapeHtml(p.name)}</h3><p class="text-gray-600 mt-1">${escapeHtml(p.description.substring(0,80))}</p><a href="/product/${p.id}" class="inline-block mt-3 text-orange-600 font-semibold">查看详情 →</a></div>
    </div>
  `).join('');
  return `<!DOCTYPE html><html><head>${renderHead(config, "产品中心 - "+config.site_title)}</head><body>${renderHeader(config, "products")}<main class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold mb-8">我们的产品</h1>${searchQuery?`<div class="mb-4">搜索“${escapeHtml(searchQuery)}”的结果：</div>`:''}<div class="grid md:grid-cols-3 gap-8">${listHtml||'<p>暂无产品，请稍后再来。</p>'}</div></main>${renderFooter(config)}</body></html>`;
}

async function renderProductDetail(kv, config, id) {
  const products = await getProducts(kv);
  const product = products.find(p => p.id == id);
  if (!product) return new Response("Product Not Found", {status:404});
  return `<!DOCTYPE html><html><head>${renderHead(config, product.name)}</head><body>${renderHeader(config, "products")}<main class="container mx-auto px-4 py-12"><div class="flex flex-col md:flex-row gap-8"><img src="${product.image_url}" class="md:w-1/2 rounded-lg shadow"><div><h1 class="text-3xl font-bold">${escapeHtml(product.name)}</h1><p class="mt-4 text-gray-700">${escapeHtml(product.description)}</p><a href="/contact?product=${product.id}" class="cta-button inline-block mt-6 text-white py-2 px-6 rounded">获取报价</a></div></div></main>${renderFooter(config)}</body></html>`;
}

async function renderSolutionsPage(kv, config) {
  const blocks = (config.solution_section.blocks || []).map(b => `
    <div class="bg-white p-6 rounded-xl shadow-md text-center">
      <i class="${b.icon} text-5xl text-orange-500 mb-3"></i>
      <h3 class="text-xl font-bold mb-2">${escapeHtml(b.title)}</h3>
      <p class="text-gray-600">${escapeHtml(b.desc)}</p>
    </div>
  `).join('');
  return `<!DOCTYPE html><html><head>${renderHead(config, "解决方案 - "+config.site_title)}</head><body>${renderHeader(config, "solutions")}<main class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold text-center mb-4">${escapeHtml(config.solution_section.title)}</h1><p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">${escapeHtml(config.solution_section.subtitle)}</p><div class="grid md:grid-cols-4 gap-8">${blocks}</div></main>${renderFooter(config)}</body></html>`;
}

async function renderBlogList(kv, config) {
  const blogs = await getBlogs(kv);
  const listHtml = blogs.map(b => `<div class="border-b pb-6 mb-6"><a href="/blog/${b.id}"><h2 class="text-2xl font-bold hover:text-orange-600">${escapeHtml(b.title)}</h2></a><p class="text-gray-500">${b.date}</p><p>${escapeHtml(b.summary)}</p></div>`).join('');
  return `<!DOCTYPE html><html><head>${renderHead(config, "资讯博客")}</head><body>${renderHeader(config,"blog")}<main class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold mb-8">最新资讯</h1>${listHtml||'<p>暂无文章</p>'}</main>${renderFooter(config)}</body></html>`;
}

async function renderBlogDetail(kv, config, id) {
  const blogs = await getBlogs(kv);
  const blog = blogs.find(b => b.id == id);
  if(!blog) return new Response("Not Found",{status:404});
  return `<!DOCTYPE html><html><head>${renderHead(config, blog.title)}</head><body>${renderHeader(config,"blog")}<main class="container mx-auto px-4 py-12"><article><h1 class="text-4xl font-bold">${escapeHtml(blog.title)}</h1><div class="text-gray-500 my-2">${blog.date}</div><div class="prose max-w-none">${blog.content}</div></article></main>${renderFooter(config)}</body></html>`;
}

async function renderAbout(kv, config) {
  return `<!DOCTYPE html><html><head>${renderHead(config, "关于我们")}</head><body>${renderHeader(config,"about")}<main class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold mb-6">关于我们</h1><div class="prose max-w-3xl">${escapeHtml(config.about_content).replace(/\n/g,'<br>')}</div></main>${renderFooter(config)}</body></html>`;
}

async function renderPrivacy(kv, config) {
  return `<!DOCTYPE html><html><head>${renderHead(config, "隐私政策")}</head><body>${renderHeader(config)}<main class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold mb-6">隐私政策</h1><div class="prose max-w-3xl">${escapeHtml(config.privacy_content).replace(/\n/g,'<br>')}</div></main>${renderFooter(config)}</body></html>`;
}

async function renderTerms(kv, config) {
  return `<!DOCTYPE html><html><head>${renderHead(config, "服务条款")}</head><body>${renderHeader(config)}<main class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold mb-6">服务条款</h1><div class="prose max-w-3xl">${escapeHtml(config.terms_content).replace(/\n/g,'<br>')}</div></main>${renderFooter(config)}</body></html>`;
}

async function renderContact(kv, config) {
  return `<!DOCTYPE html><html><head>${renderHead(config, "联系我们")}</head><body>${renderHeader(config,"contact")}<main class="container mx-auto px-4 py-12"><div class="grid md:grid-cols-2 gap-8"><div><h1 class="text-3xl font-bold">获取报价 / 咨询</h1><p>我们的团队将在24小时内回复。</p><form id="inquiryForm" class="mt-6 space-y-4"><input type="text" id="inqName" placeholder="您的姓名" class="w-full border p-2 rounded" required><input type="email" id="inqEmail" placeholder="电子邮箱" class="w-full border p-2 rounded" required><textarea id="inqMsg" rows="5" placeholder="产品需求或询盘内容..." class="w-full border p-2 rounded" required></textarea><button type="submit" class="cta-button text-white py-2 px-6 rounded">发送询盘</button></form><div id="formMsg"></div></div><div><h2 class="text-2xl font-bold">联系方式</h2><p><i class="fas fa-map-marker-alt"></i> ${config.address}</p><p><i class="fas fa-phone"></i> ${config.phone}</p><p><i class="fas fa-envelope"></i> ${config.email}</p><a href="${config.whatsapp_link}" class="inline-block bg-green-500 text-white px-4 py-2 rounded mt-4"><i class="fab fa-whatsapp"></i> WhatsApp 即时聊天</a></div></div></main><script>
  document.getElementById('inquiryForm')?.addEventListener('submit', async function(e){
    e.preventDefault();
    let name=document.getElementById('inqName').value, email=document.getElementById('inqEmail').value, message=document.getElementById('inqMsg').value;
    let resp = await fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message})});
    let data = await resp.json();
    document.getElementById('formMsg').innerHTML = '<div class="bg-green-100 p-2 rounded mt-2">'+data.message+'</div>';
    if(resp.ok) document.getElementById('inquiryForm').reset();
  });
</script>${renderFooter(config)}</body></html>`;
}

// ================= 修复后的管理后台 =================
function renderAdminLogin() {
  return `<!DOCTYPE html><html><head><title>管理后台登录</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 flex items-center justify-center h-screen"><div class="bg-white p-8 rounded shadow-md w-96"><h1 class="text-2xl font-bold mb-4">管理员登录</h1><form id="loginForm"><input type="password" id="password" placeholder="密码" class="w-full border p-2 mb-4 rounded" required><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded">登录</button></form><div id="error" class="text-red-500 mt-2"></div></div><script>document.getElementById('loginForm').addEventListener('submit', async (e)=>{e.preventDefault(); let pwd=document.getElementById('password').value; let res=await fetch('/admin/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})}); if(res.ok) { localStorage.setItem('admin_token','true'); window.location.href='/admin/dashboard'; } else { document.getElementById('error').innerText='密码错误'; } });</script></body></html>`;
}

function renderAdminDashboard() {
  return `<!DOCTYPE html><html><head><title>网站管理后台</title><script src="https://cdn.tailwindcss.com"></script><script src="https://code.jquery.com/jquery-3.7.1.min.js"></script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"></head><body class="bg-gray-100"><div class="flex"><div class="w-64 bg-gray-800 text-white min-h-screen p-4"><h2 class="text-xl font-bold mb-6">管理导航</h2><ul id="adminNav"><li><a href="#" data-section="config" class="nav-link block py-2">站点配置</a></li><li><a href="#" data-section="products" class="nav-link block py-2">产品管理</a></li><li><a href="#" data-section="blogs" class="nav-link block py-2">博客管理</a></li><li><a href="#" data-section="inquiries" class="nav-link block py-2">询盘列表</a></li><li><a href="#" data-section="subscribers" class="nav-link block py-2">订阅用户</a></li><li><a href="#" data-section="solutions" class="nav-link block py-2">解决方案配置</a></li><li><a href="/logout" class="block py-2 text-red-300">退出登录</a></li></ul></div><div class="flex-1 p-8" id="mainContent"><h1 class="text-2xl font-bold">欢迎使用管理面板</h1><p>点击左侧菜单管理网站内容</p></div></div><script>
    // 确保在DOM加载完成后绑定事件
    document.addEventListener('DOMContentLoaded', function() {
      // 获取存储的token
      const API_TOKEN = localStorage.getItem('admin_token');
      if (!API_TOKEN) {
        window.location.href = '/admin';
        return;
      }
      
      // 封装fetch
      window.apiFetch = function(url, opts) {
        return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', 'X-Admin-Token': API_TOKEN } });
      };
      
      // 加载各个模块的函数（挂载到window以便onclick调用）
      window.loadConfig = async function() {
        document.getElementById('mainContent').innerHTML = '<div class="text-center py-20">加载中...</div>';
        try {
          let resp = await window.apiFetch('/admin/api/config');
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          let cfg = await resp.json();
          let html = '<form id="configForm" class="space-y-4 bg-white p-6 rounded shadow"><h2 class="text-xl font-bold">基本设置</h2>' +
            '<input name="site_title" value="'+escapeHtml(cfg.site_title)+'" class="w-full border p-2" placeholder="站点标题">' +
            '<textarea name="site_description" class="w-full border p-2">'+escapeHtml(cfg.site_description)+'</textarea>' +
            '<input name="logo_url" value="'+escapeHtml(cfg.logo_url)+'" class="w-full border p-2">' +
            '<input name="email" value="'+escapeHtml(cfg.email)+'" class="w-full border p-2">' +
            '<input name="phone" value="'+escapeHtml(cfg.phone)+'" class="w-full border p-2">' +
            '<input name="whatsapp_link" value="'+escapeHtml(cfg.whatsapp_link)+'" class="w-full border p-2">' +
            '<h3>社交媒体(JSON格式)</h3><textarea name="social_links" class="w-full border p-2 h-32">'+JSON.stringify(cfg.social_links,null,2)+'</textarea>' +
            '<h3>英雄区</h3><input name="hero_h1" value="'+escapeHtml(cfg.hero.h1)+'" class="w-full border p-2">' +
            '<input name="hero_subtitle" value="'+escapeHtml(cfg.hero.subtitle)+'" class="w-full border p-2">' +
            '<h3>关于我们内容</h3><textarea name="about_content" class="w-full border p-2">'+escapeHtml(cfg.about_content)+'</textarea>' +
            '<h3>隐私政策内容</h3><textarea name="privacy_content" class="w-full border p-2">'+escapeHtml(cfg.privacy_content)+'</textarea>' +
            '<h3>服务条款内容</h3><textarea name="terms_content" class="w-full border p-2">'+escapeHtml(cfg.terms_content)+'</textarea>' +
            '<button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">保存全部配置</button></form>';
          document.getElementById('mainContent').innerHTML = html;
          document.getElementById('configForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            let fd = new FormData(e.target);
            let payload = {};
            for(let [k,v] of fd.entries()) payload[k]=v;
            try { payload.social_links = JSON.parse(payload.social_links); } catch(e) { alert('社交媒体JSON格式错误'); return; }
            let res = await window.apiFetch('/admin/api/config',{method:'PUT',body:JSON.stringify(payload)});
            alert(await res.text());
          });
        } catch(err) { console.error(err); document.getElementById('mainContent').innerHTML = '<div class="text-red-500">加载失败，请检查网络或重试。</div>'; }
      };
      
      window.loadProducts = async function() {
        document.getElementById('mainContent').innerHTML = '<div class="text-center py-20">加载中...</div>';
        try {
          let resp = await window.apiFetch('/admin/api/products');
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          let prods = await resp.json();
          let html = '<div><button onclick="showAddProduct()" class="bg-blue-600 text-white px-3 py-1 rounded">添加产品</button><div class="grid gap-4 mt-4">' +
            prods.map(p => '<div class="bg-white p-4 shadow">'+escapeHtml(p.name)+
              '<button onclick="deleteProduct('+p.id+')" class="ml-4 bg-red-500 text-white px-2 rounded">删除</button>' +
              '<button onclick="editProduct('+p.id+')" class="ml-2 bg-yellow-500 px-2 rounded">编辑</button></div>').join('') +
            '</div></div><div id="productModal"></div>';
          document.getElementById('mainContent').innerHTML = html;
          window.deleteProduct = async (id) => { if(confirm('删除产品?')){ await window.apiFetch('/admin/api/products/'+id,{method:'DELETE'}); loadProducts(); } };
          window.showAddProduct = () => {
            document.getElementById('productModal').innerHTML = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div class="bg-white p-6 rounded"><h3>添加产品</h3><input id="pName" placeholder="名称" class="border p-1 w-full"><input id="pDesc" placeholder="描述" class="border p-1 w-full mt-2"><input id="pImg" placeholder="图片URL" class="border p-1 w-full mt-2"><button onclick="saveProduct()" class="bg-green-600 text-white px-3 py-1 mt-2">保存</button><button onclick="document.getElementById(\'productModal\').innerHTML=\'\'" class="ml-2">取消</button></div></div>';
          };
          window.saveProduct = async () => {
            let name = document.getElementById('pName').value, description = document.getElementById('pDesc').value, image_url = document.getElementById('pImg').value;
            await window.apiFetch('/admin/api/products',{method:'POST',body:JSON.stringify({name,description,image_url})});
            document.getElementById('productModal').innerHTML = '';
            loadProducts();
          };
          window.editProduct = async (id) => {
            let prod = prods.find(p => p.id == id);
            document.getElementById('productModal').innerHTML = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div class="bg-white p-6 rounded"><h3>编辑产品</h3><input id="pName" value="'+escapeHtml(prod.name)+'" class="border p-1 w-full"><input id="pDesc" value="'+escapeHtml(prod.description)+'" class="border p-1 w-full mt-2"><input id="pImg" value="'+escapeHtml(prod.image_url)+'" class="border p-1 w-full mt-2"><button onclick="updateProduct('+id+')" class="bg-green-600 text-white px-3 py-1 mt-2">更新</button><button onclick="document.getElementById(\'productModal\').innerHTML=\'\'" class="ml-2">取消</button></div></div>';
          };
          window.updateProduct = async (id) => {
            let name = document.getElementById('pName').value, description = document.getElementById('pDesc').value, image_url = document.getElementById('pImg').value;
            await window.apiFetch('/admin/api/products/'+id,{method:'PUT',body:JSON.stringify({name,description,image_url})});
            document.getElementById('productModal').innerHTML = '';
            loadProducts();
          };
        } catch(err) { console.error(err); document.getElementById('mainContent').innerHTML = '<div class="text-red-500">加载失败</div>'; }
      };
      
      window.loadBlogs = async function() {
        document.getElementById('mainContent').innerHTML = '<div class="text-center py-20">加载中...</div>';
        try {
          let resp = await window.apiFetch('/admin/api/blogs');
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          let blogs = await resp.json();
          let html = '<div><button onclick="showAddBlog()" class="bg-blue-600 text-white px-3 py-1 rounded">添加文章</button><div class="grid gap-4 mt-4">' +
            blogs.map(b => '<div class="bg-white p-4 shadow">'+escapeHtml(b.title)+
              '<button onclick="deleteBlog('+b.id+')" class="ml-4 bg-red-500 text-white px-2 rounded">删除</button>' +
              '<button onclick="editBlog('+b.id+')" class="ml-2 bg-yellow-500 px-2 rounded">编辑</button></div>').join('') +
            '</div></div><div id="blogModal"></div>';
          document.getElementById('mainContent').innerHTML = html;
          window.deleteBlog = async (id) => { if(confirm('删除?')){ await window.apiFetch('/admin/api/blogs/'+id,{method:'DELETE'}); loadBlogs(); } };
          window.showAddBlog = () => {
            document.getElementById('blogModal').innerHTML = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div class="bg-white p-6 rounded"><h3>添加博客</h3><input id="bTitle" placeholder="标题" class="border p-1 w-full"><textarea id="bContent" placeholder="内容HTML" class="border p-1 w-full mt-2"></textarea><input id="bSummary" placeholder="摘要" class="border p-1 w-full mt-2"><button onclick="saveBlog()" class="bg-green-600 text-white px-3 py-1 mt-2">发布</button></div></div>';
          };
          window.saveBlog = async () => {
            let title = document.getElementById('bTitle').value, content = document.getElementById('bContent').value, summary = document.getElementById('bSummary').value, date = new Date().toISOString().slice(0,10);
            await window.apiFetch('/admin/api/blogs',{method:'POST',body:JSON.stringify({title,content,summary,date})});
            document.getElementById('blogModal').innerHTML = '';
            loadBlogs();
          };
          window.editBlog = async (id) => {
            let blog = blogs.find(b => b.id == id);
            document.getElementById('blogModal').innerHTML = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div class="bg-white p-6 rounded"><input id="bTitle" value="'+escapeHtml(blog.title)+'" class="border p-1 w-full"><textarea id="bContent" class="border p-1 w-full mt-2">'+escapeHtml(blog.content)+'</textarea><input id="bSummary" value="'+escapeHtml(blog.summary)+'" class="border p-1 w-full mt-2"><button onclick="updateBlog('+id+')" class="bg-green-600 text-white px-3 py-1 mt-2">更新</button></div></div>';
          };
          window.updateBlog = async (id) => {
            let title = document.getElementById('bTitle').value, content = document.getElementById('bContent').value, summary = document.getElementById('bSummary').value;
            await window.apiFetch('/admin/api/blogs/'+id,{method:'PUT',body:JSON.stringify({title,content,summary})});
            document.getElementById('blogModal').innerHTML = '';
            loadBlogs();
          };
        } catch(err) { console.error(err); document.getElementById('mainContent').innerHTML = '<div class="text-red-500">加载失败</div>'; }
      };
      
      window.loadInquiries = async function() {
        document.getElementById('mainContent').innerHTML = '<div class="text-center py-20">加载中...</div>';
        try {
          let resp = await window.apiFetch('/admin/api/inquiries');
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          let data = await resp.json();
          let items = data.map(i => '<li class="border-b p-2">'+JSON.stringify(i)+'</li>').join('');
          document.getElementById('mainContent').innerHTML = '<ul class="bg-white p-4 rounded shadow">'+items+'</ul>';
        } catch(err) { console.error(err); document.getElementById('mainContent').innerHTML = '<div class="text-red-500">加载失败</div>'; }
      };
      
      window.loadSubscribers = async function() {
        document.getElementById('mainContent').innerHTML = '<div class="text-center py-20">加载中...</div>';
        try {
          let resp = await window.apiFetch('/admin/api/subscribers');
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          let data = await resp.json();
          let items = data.map(i => '<li class="border-b p-2">'+escapeHtml(i.email)+' ('+i.date+')</li>').join('');
          document.getElementById('mainContent').innerHTML = '<ul class="bg-white p-4 rounded shadow">'+items+'</ul>';
        } catch(err) { console.error(err); document.getElementById('mainContent').innerHTML = '<div class="text-red-500">加载失败</div>'; }
      };
      
      window.loadSolutions = async function() {
        document.getElementById('mainContent').innerHTML = '<div class="text-center py-20">加载中...</div>';
        try {
          let resp = await window.apiFetch('/admin/api/config');
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          let cfg = await resp.json();
          let blocks = cfg.solution_section.blocks;
          let html = '<form id="solutionsForm" class="bg-white p-6 rounded shadow"><h2 class="text-xl font-bold mb-4">解决方案板块配置</h2>' +
            '<input name="solution_title" value="'+escapeHtml(cfg.solution_section.title)+'" class="w-full border p-2 mb-2" placeholder="板块标题">' +
            '<input name="solution_subtitle" value="'+escapeHtml(cfg.solution_section.subtitle)+'" class="w-full border p-2 mb-4" placeholder="副标题">' +
            '<h3>方案模块 (JSON格式)</h3><textarea name="solution_blocks" class="w-full border p-2 h-40">'+JSON.stringify(blocks,null,2)+'</textarea>' +
            '<button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">保存解决方案</button></form>';
          document.getElementById('mainContent').innerHTML = html;
          document.getElementById('solutionsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            let fd = new FormData(e.target);
            let newTitle = fd.get('solution_title');
            let newSub = fd.get('solution_subtitle');
            let newBlocks = JSON.parse(fd.get('solution_blocks'));
            let current = await (await window.apiFetch('/admin/api/config')).json();
            current.solution_section = { title: newTitle, subtitle: newSub, blocks: newBlocks };
            await window.apiFetch('/admin/api/config', { method:'PUT', body: JSON.stringify(current) });
            alert('解决方案已更新');
            loadSolutions();
          });
        } catch(err) { console.error(err); document.getElementById('mainContent').innerHTML = '<div class="text-red-500">加载失败</div>'; }
      };
      
      // 绑定菜单点击事件
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          let section = link.getAttribute('data-section');
          if (section === 'config') loadConfig();
          else if (section === 'products') loadProducts();
          else if (section === 'blogs') loadBlogs();
          else if (section === 'inquiries') loadInquiries();
          else if (section === 'subscribers') loadSubscribers();
          else if (section === 'solutions') loadSolutions();
        });
      });
      
      // 默认加载配置页
      loadConfig();
    });
    
    function escapeHtml(str) {
      if (!str) return "";
      return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    }
  </script></body></html>`;
}

// ----- Worker 入口 -----
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const kv = env.MY_KV;
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "admin123";

    if (!kv) {
      return new Response("Error: KV namespace 'MY_KV' not bound. Please bind it in Worker settings.", { status: 500 });
    }

    function isAdminRequest(request) {
      const token = request.headers.get("X-Admin-Token");
      return token === ADMIN_PASSWORD;
    }

    // 公开API
    if (path === "/api/inquiry" && request.method === "POST") {
      try {
        const { name, email, message } = await request.json();
        const inquiries = await getInquiries(kv);
        inquiries.push({ id: Date.now(), name, email, message, date: new Date().toISOString() });
        await saveInquiries(kv, inquiries);
        return new Response(JSON.stringify({ message: "询盘已发送，我们会尽快联系您" }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ message: "服务器错误，请稍后重试" }), { status: 500 });
      }
    }
    if (path === "/api/subscribe" && request.method === "POST") {
      try {
        const { email } = await request.json();
        const subs = await getSubscribers(kv);
        if (!subs.find(s => s.email === email)) subs.push({ email, date: new Date().toISOString() });
        await saveSubscribers(kv, subs);
        return new Response(JSON.stringify({ message: "订阅成功" }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ message: "订阅失败" }), { status: 500 });
      }
    }

    // 管理后台路由
    if (path === "/admin") return new Response(renderAdminLogin(), { headers: { "Content-Type": "text/html" } });
    if (path === "/admin/dashboard") {
      const cookie = request.headers.get("Cookie") || "";
      if (cookie.includes("admin_token=true")) return new Response(renderAdminDashboard(), { headers: { "Content-Type": "text/html" } });
      return Response.redirect("/admin", 302);
    }
    if (path === "/admin/api/check" && request.method === "POST") {
      const { password } = await request.json();
      if (password === ADMIN_PASSWORD) return new Response("ok", { status: 200, headers: { "Set-Cookie": "admin_token=true; path=/" } });
      return new Response("unauthorized", { status: 401 });
    }
    if (path.startsWith("/admin/api/")) {
      if (!isAdminRequest(request)) return new Response("Unauthorized", { status: 401 });
      if (path === "/admin/api/config" && request.method === "GET") {
        return new Response(JSON.stringify(await getConfig(kv)), { headers: { "Content-Type": "application/json" } });
      }
      if (path === "/admin/api/config" && request.method === "PUT") {
        const newConfig = await request.json();
        await saveConfig(kv, newConfig);
        return new Response("配置已更新");
      }
      if (path === "/admin/api/products" && request.method === "GET") {
        return new Response(JSON.stringify(await getProducts(kv)));
      }
      if (path === "/admin/api/products" && request.method === "POST") {
        const { name, description, image_url } = await request.json();
        const products = await getProducts(kv);
        const newId = Date.now();
        products.push({ id: newId, name, description, image_url });
        await saveProducts(kv, products);
        return new Response("ok");
      }
      if (path.match(/\/admin\/api\/products\/\d+/) && request.method === "DELETE") {
        const id = parseInt(path.split("/").pop());
        let products = await getProducts(kv);
        products = products.filter(p => p.id !== id);
        await saveProducts(kv, products);
        return new Response("ok");
      }
      if (path.match(/\/admin\/api\/products\/\d+/) && request.method === "PUT") {
        const id = parseInt(path.split("/").pop());
        const { name, description, image_url } = await request.json();
        let products = await getProducts(kv);
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) products[idx] = { id, name, description, image_url };
        await saveProducts(kv, products);
        return new Response("ok");
      }
      if (path === "/admin/api/blogs" && request.method === "GET") {
        return new Response(JSON.stringify(await getBlogs(kv)));
      }
      if (path === "/admin/api/blogs" && request.method === "POST") {
        const { title, content, summary, date } = await request.json();
        const blogs = await getBlogs(kv);
        const newId = Date.now();
        blogs.push({ id: newId, title, content, summary, date });
        await saveBlogs(kv, blogs);
        return new Response("ok");
      }
      if (path.match(/\/admin\/api\/blogs\/\d+/) && request.method === "DELETE") {
        const id = parseInt(path.split("/").pop());
        let blogs = await getBlogs(kv);
        blogs = blogs.filter(b => b.id !== id);
        await saveBlogs(kv, blogs);
        return new Response("ok");
      }
      if (path.match(/\/admin\/api\/blogs\/\d+/) && request.method === "PUT") {
        const id = parseInt(path.split("/").pop());
        const { title, content, summary } = await request.json();
        let blogs = await getBlogs(kv);
        const idx = blogs.findIndex(b => b.id === id);
        if (idx !== -1) blogs[idx] = { ...blogs[idx], title, content, summary };
        await saveBlogs(kv, blogs);
        return new Response("ok");
      }
      if (path === "/admin/api/inquiries") {
        return new Response(JSON.stringify(await getInquiries(kv)));
      }
      if (path === "/admin/api/subscribers") {
        return new Response(JSON.stringify(await getSubscribers(kv)));
      }
    }

    // 前台页面路由
    const config = await getConfig(kv);
    if (path === "/" || path === "") return new Response(await renderHome(kv, config), { headers: { "Content-Type": "text/html" } });
    if (path === "/products") {
      const search = url.searchParams.get("search") || "";
      return new Response(await renderProductsPage(kv, config, search), { headers: { "Content-Type": "text/html" } });
    }
    if (path.startsWith("/product/")) {
      const id = path.split("/")[2];
      return new Response(await renderProductDetail(kv, config, id), { headers: { "Content-Type": "text/html" } });
    }
    if (path === "/solutions") return new Response(await renderSolutionsPage(kv, config), { headers: { "Content-Type": "text/html" } });
    if (path === "/blog") return new Response(await renderBlogList(kv, config), { headers: { "Content-Type": "text/html" } });
    if (path.startsWith("/blog/") && !path.includes("/api")) {
      const id = path.split("/")[2];
      return new Response(await renderBlogDetail(kv, config, id), { headers: { "Content-Type": "text/html" } });
    }
    if (path === "/about") return new Response(await renderAbout(kv, config), { headers: { "Content-Type": "text/html" } });
    if (path === "/privacy") return new Response(await renderPrivacy(kv, config), { headers: { "Content-Type": "text/html" } });
    if (path === "/terms") return new Response(await renderTerms(kv, config), { headers: { "Content-Type": "text/html" } });
    if (path === "/contact") return new Response(await renderContact(kv, config), { headers: { "Content-Type": "text/html" } });
    if (path === "/logout") {
      return new Response("Logged out", { headers: { "Set-Cookie": "admin_token=; path=/; max-age=0" } });
    }
    return new Response("Page Not Found", { status: 404 });
  }
};