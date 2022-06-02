export type Nullable<T> = T | null;

export enum TokenUse {
  ACCESS = 'access',
  ID = 'id'
}

export interface Pems {
  [key: string]: string;
}

export type JWTValidatorConfig = {
  region?: string;
  userPoolId: string;
  tokenUse?: TokenUse[];
  audience: string[];
  pems?: Nullable<Pems>;
};

export interface JwtPayload {
  [key: string]: any;
  iss?: string | undefined;
  sub?: string | undefined;
  aud?: string | string[] | undefined;
  exp?: number | undefined;
  nbf?: number | undefined;
  iat?: number | undefined;
  jti?: string | undefined;
}

export type NextFunction = (err?: any) => void;
export type RequestHandler = (req: any, res: any, next: NextFunction) => any;
export type ErrorHandler = (err: any, req: any, res: any, next: NextFunction) => any;

export function isJWTValidatorError(err: Error): boolean;
export function authenticate(config: JWTValidatorConfig): RequestHandler;
export function authenticationError(): ErrorHandler;
export class JWTValidator {
  constructor(config: JWTValidatorConfig);
  validate(token: string): Promise<JwtPayload>;
}
