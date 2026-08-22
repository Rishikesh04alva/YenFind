import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [], // Strip all HTML tags
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

function deepSanitize(target: any): any {
  if (typeof target === 'string') {
    return sanitizeHtml(target.trim(), sanitizeOptions);
  }
  if (Array.isArray(target)) {
    return target.map(deepSanitize);
  }
  if (target !== null && typeof target === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(target)) {
      sanitizedObj[key] = deepSanitize(target[key]);
    }
    return sanitizedObj;
  }
  return target;
}

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = deepSanitize(req.body);
  }
  if (req.query) {
    req.query = deepSanitize(req.query);
  }
  if (req.params) {
    req.params = deepSanitize(req.params);
  }
  next();
}
