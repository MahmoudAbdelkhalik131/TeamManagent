import {Router} from 'express'
import userValidation from './user.validation'
import userService from './user.service'
const Usersrouter=Router()

Usersrouter.post('/register',userValidation.register,userService.register)
Usersrouter.post('/login',userValidation.login,userService.login)


export default Usersrouter

