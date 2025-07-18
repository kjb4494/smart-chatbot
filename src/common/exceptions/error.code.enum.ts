export const ErrorCode = {
  UNAUTHORIZED: {
    status: 401,
    code: 40100001,
    message: '로그인이 필요합니다.',
  },
  INVALID_TOKEN: {
    status: 401,
    code: 40100002,
    message: '유효한 토큰이 아닙니다.',
  },
  EXPIRED_TOKEN: {
    status: 401,
    code: 40100003,
    message: '토큰 기한이 만료되었습니다.',
  },
  BLOCKED_ACCOUNT: {
    status: 401,
    code: 40100004,
    message: '정지된 계정입니다.',
  },
  WITHDRAWN_ACCOUNT: {
    status: 401,
    code: 40100005,
    message: '탈퇴한 계정입니다.',
  },
  INVALID_CREDENTIALS: {
    status: 401,
    code: 40100101,
    message: '잘못된 이메일 또는 비밀번호입니다.',
  },
  FORBIDDEN: {
    status: 403,
    code: 40300001,
    message: '이 페이지를 볼 수 있는 권한이 없습니다.',
  },
} as const;

export type ErrorCodeKey = keyof typeof ErrorCode;
export type ErrorCodeValue = (typeof ErrorCode)[ErrorCodeKey];
