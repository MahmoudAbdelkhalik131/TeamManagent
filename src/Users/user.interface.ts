import {Document} from 'mongoose'
interface Users extends Document{
readonly username:string;
password:string;
readonly role:'admin'|'member';
}

export default Users