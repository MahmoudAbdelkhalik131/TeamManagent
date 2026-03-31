declare namespace NodeJS{
    interface ProcessEnv{
        readonly PORT:string;
        readonly DBLINK:string;
        JWT_SECRET_KEY:any;
        JWT_EXPIRE_DATE:any;
        NODE_ENV:string;
        CLOUDINARY_URL:string;
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY:string;
        CLOUDINARY_API_SECRET:string;
        
    }
}