import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideEchartsCore } from 'ngx-echarts';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import * as echarts from 'echarts';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideEchartsCore({ echarts }),
    provideTanStackQuery(new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 0,
          retry: 1,
          refetchOnWindowFocus: false,
        }
      }
    }))
  ]
};
