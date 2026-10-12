type StartupOptions = {
  document?: Document;
  locale?: string;
  retry?: () => void;
};

const messages = {
  'zh-CN': {
    title: '暂时无法打开工作空间',
    description: '请稍后重试，继续处理您的工作。',
    retry: '重新打开',
  },
  'en-US': {
    title: 'Your workspace could not be opened',
    description: 'Please try again in a moment to continue your work.',
    retry: 'Try again',
  },
};

function showStartupFailure(options: StartupOptions) {
  const page = options.document ?? document;
  const locale = (options.locale ?? page.documentElement.lang).startsWith('en') ? 'en-US' : 'zh-CN';
  const copy = messages[locale];
  // This boundary must work even when the application styles and modules failed to load.
  page.querySelector('#__app-loading__')?.remove();
  page.querySelectorAll('[data-app-loading^="inject"]').forEach((element) => element.remove());
  page.querySelector('#cs-startup-style')?.remove();

  const style = page.createElement('style');
  style.id = 'cs-startup-style';
  style.textContent = `
    .cs-startup { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; box-sizing:border-box; overflow:auto; padding:32px 20px; background:#f6f8fa; color:#17212f; font:14px/1.65 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
    .cs-startup-card { width:100%; max-width:480px; box-sizing:border-box; padding:42px 32px; border:1px solid #e4e9ed; border-radius:14px; background:#fff; box-shadow:0 12px 40px #17212f08; }
    .cs-startup-brand { display:flex; align-items:center; gap:10px; margin-bottom:34px; font-size:18px; font-weight:650; }
    .cs-startup-mark { display:grid; place-items:center; width:32px; height:32px; border-radius:9px; background:#0f766e; color:white; font-size:20px; font-weight:650; }
    .cs-startup h1 { margin:0 0 12px; font-size:23px; font-weight:600; line-height:1.5; letter-spacing:-.4px; }
    .cs-startup p { margin:0 0 28px; color:#697586; font-size:14px; }
    .cs-startup button { display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:0 20px; border:1px solid #0f766e; border-radius:7px; background:#0f766e; color:#fff; font:inherit; font-weight:550; cursor:pointer; }
    .cs-startup button:hover { background:#0b625c; }
    .cs-startup button:focus-visible { outline:3px solid #0f766e55; outline-offset:3px; }
    @media(max-width:480px) { .cs-startup-card { padding:32px 24px; } .cs-startup h1 { font-size:21px; } }
  `;
  page.head.append(style);

  const main = page.createElement('main');
  main.className = 'cs-startup';
  main.setAttribute('aria-labelledby', 'cs-startup-title');
  main.setAttribute('lang', locale);
  const card = page.createElement('section');
  card.className = 'cs-startup-card';
  const brand = page.createElement('div');
  brand.className = 'cs-startup-brand';
  const mark = page.createElement('span');
  mark.className = 'cs-startup-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = 'C';
  brand.append(mark, 'CS Biz');
  const title = page.createElement('h1');
  title.id = 'cs-startup-title';
  title.textContent = copy.title;
  title.tabIndex = -1;
  const description = page.createElement('p');
  description.textContent = copy.description;
  const retry = page.createElement('button');
  retry.type = 'button';
  retry.textContent = copy.retry;
  // Reloading also retries rejected module evaluations, which are cached within this document.
  retry.addEventListener('click', options.retry ?? (() => location.reload()));
  card.append(brand, title, description, retry);
  main.append(card);
  let root = page.querySelector('#app');
  if (!root) {
    root = page.createElement('div');
    root.id = 'app';
    page.body.append(root);
  }
  root.replaceChildren(main);
  page.title = `${copy.title} · CS Biz`;
  title.focus();
}

export async function startApplication(start: () => Promise<void>, options: StartupOptions = {}): Promise<boolean> {
  try {
    await start();
    return true;
  } catch {
    showStartupFailure(options);
    return false;
  }
}
