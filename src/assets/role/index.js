// Artes do Rolê (capas e personagens). Decorativas: alt vazio quando o nome do jogo está ao lado.
import logo from './logo-role.svg'
import draft from './capa-draft.webp'
import impostor from './capa-impostor.webp'
import manada from './capa-manada.webp'
import themind from './capa-themind.webp'
import mimica from './capa-mimica.webp'
import pdf from './capa-pdf.webp'
import resistencia from './capa-resistencia.webp'
import tabu from './capa-tabu.webp'
import papelitos from './capa-papelitos.webp'
import quemsoueu from './capa-quemsoueu.webp'
import nota from './capa-nota.webp'
import palpite from './capa-palpite.webp'
import carreira from './capa-nba.webp'
import personagemImpostor from './personagem-impostor.webp'
import personagemVaca from './personagem-vaca.webp'

export const LOGO = logo
export const CAPAS = { draft, impostor, manada, themind, mimica, pdf, resistencia, tabu, papelitos, quemsoueu, nota, palpite, carreira }

// Onde cortar quando a capa vira faixa larga (3:1): mantém o assunto principal visível
export const FOCOS = {
  draft: '78% 50%', impostor: '50% 45%', manada: '50% 40%', themind: '50% 50%', mimica: '50% 45%', pdf: '50% 45%', resistencia: '50% 62%',
  tabu: '68% 28%', papelitos: '50% 38%', quemsoueu: '45% 32%', nota: '50% 62%', palpite: '58% 45%', carreira: '45% 62%',
}
export const PERSONAGENS = { impostor: personagemImpostor, vaca: personagemVaca }
