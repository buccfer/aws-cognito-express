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

export function isJWTValidatorError(err: Error): boolean;
export function authenticate(config: JWTValidatorConfig): Function;
export function authenticationError(): Function;