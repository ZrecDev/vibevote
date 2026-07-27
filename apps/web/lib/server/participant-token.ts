import 'server-only';
import { PARTICIPANT_COOKIE_NAME } from './participant-cookie';

export function participantToken(request: Request) {
  return request.headers
    .get('cookie')
    ?.match(new RegExp(`(?:^|;\\s*)${PARTICIPANT_COOKIE_NAME}=([^;]+)`))?.[1];
}
