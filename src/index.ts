import { Elysia } from "elysia";
import { staticPlugin } from '@elysiajs/static';
import App from './react/App';

const app = new Elysia()
  .use(staticPlugin())
  .get('/', () => {
    return 'Our first route'
  })
  .listen(3000)