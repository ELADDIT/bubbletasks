const TPL_IMG_PREFIX = 'bubbletasks:tplimg:';

export function saveTemplateImage(templateKey: string, dataUrl: string) {
  localStorage.setItem(TPL_IMG_PREFIX + templateKey, dataUrl);
}

export function loadTemplateImage(templateKey: string): string | undefined {
  return localStorage.getItem(TPL_IMG_PREFIX + templateKey) || undefined;
}

export function toTemplateKey(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
