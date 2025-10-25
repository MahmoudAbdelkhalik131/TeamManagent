declare namespace NodeJS{
    interface ProcessEnv{
        readonly PORT:string;
        readonly DBLINK:string;
        JWT_SECRET_KEY:any;
        JWT_EXPIRE_DATE:any;
        NODE_ENV:string;
        
    }
}