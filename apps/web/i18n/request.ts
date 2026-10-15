import { getRequestConfig } from 'next-intl/server';

// Bulgarian is the only UI locale in v1; another language means another messages file.
export default getRequestConfig(async () => {
  const locale = 'bg';
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
