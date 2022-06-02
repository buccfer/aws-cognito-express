export type Nullable<T> = T | null;

export enum TokenUse {
  ACCESS = 'access',
  ID = 'id'
}

export interface Pems {
  [key: string]: string;
}

export type JWTValidatorConfig = {
  region?: string
  userPoolId: string
  tokenUse?: TokenUse[]
  audience: string[]
  pems?: Nullable<Pems>
};

export type NextFunction = (err?: any) => void;
export type RequestHandler = (req: any, res: any, next: NextFunction) => any;
export type ErrorHandler = (err: any, req: any, res: any, next: NextFunction) => any;

export function isJWTValidatorError(err: Error): boolean;
export function authenticate(config: JWTValidatorConfig): RequestHandler;
export function authenticationError(): ErrorHandler;
