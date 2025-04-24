declare namespace NodeJS{
    interface ProcessEnv{
        readonly PORT:string;
        readonly DBLINK:string;
    }
}