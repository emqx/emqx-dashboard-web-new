import { moveAuthn } from '@/api/auth'
import { AuthnItem } from '@/types/auth'
import { TargetPosition } from '@/types/enum'

export default () => {
  const moveAuthnBeforeAnotherAuthn = (authn: AuthnItem, anotherAuthn: AuthnItem) => {
    return moveAuthn(authn.id, `${TargetPosition.Before}${anotherAuthn.id}`)
  }
  const moveAuthnToTop = (authn: AuthnItem) => {
    return moveAuthn(authn.id, TargetPosition.Top)
  }
  const moveAuthnToBottom = (authn: AuthnItem) => {
    return moveAuthn(authn.id, TargetPosition.Bottom)
  }
  return {
    moveAuthnBeforeAnotherAuthn,
    moveAuthnToTop,
    moveAuthnToBottom,
  }
}
