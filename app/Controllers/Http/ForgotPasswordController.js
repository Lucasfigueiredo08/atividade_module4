'use strict'

const Moment = require('moment')
const crypto = require('crypto')
const User = use('App/Models/User')
const Mail = use('Mail')

class ForgotPasswordController {
  async store ({ request, response }) {
    try {
      const email = request.input('email')
      const user = await User.findBy('email', email)

      user.token = crypto.randomBytes(10).toString('hex')
      user.token_created_at = new Date()

      await user.save()

      await Mail.send(
        ['emails.forgot_password'],
        { email,
          token: user.token,
          link: `${request.input('redirect_url')}?token=${user.token}`
        },
        message => {
          message
            .to(user.email)
            .from('lukas.liberato14@gmail.com', 'Lucas | Horizon')
            .subject('Recuperação de Senha')
        })
    } catch (err) {
      return response
        .status(err.status)
        .send({ error: { message: 'Algo deu errado!' } })
    }
  }

  async update ({ request, response }) {
    try {
      const { token, password } = request.all()

      const user = await User.findByOrFail('token', token)

      const tokenExpired = Moment()
        .subtract('2', 'days') // verifica se o token não ultrapassou os  2 dias
        .isAfter(user.token_created_at) // compara

      if (tokenExpired) {
        return response
          .status(401) // erro de não autorizado
          .send({ error: { message: 'O token de recuperação está expirado' } })
      }

      user.token = null // limpa o token
      user.token_created_at = null // limpa a data
      user.password = password // troca a senha

      await user.save()
    } catch (err) {
      return response
        .status(err.status)
        .send({ error: { message: 'algo deu errado ao resetar!' } })
    }
  }
}

module.exports = ForgotPasswordController
