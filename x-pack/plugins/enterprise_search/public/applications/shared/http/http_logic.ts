/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { kea, MakeLogicType } from 'kea';

import { HttpSetup, HttpInterceptorResponseError, HttpResponse } from 'src/core/public';

import {
  ENTERPRISE_SEARCH_KIBANA_COOKIE,
  ENTERPRISE_SEARCH_SESSION_HEADER,
  READ_ONLY_MODE_HEADER,
} from '../../../../common/constants';

interface HttpValues {
  http: HttpSetup;
  httpInterceptors: Function[];
  errorConnecting: boolean;
  readOnlyMode: boolean;
}
interface HttpActions {
  initializeHttpInterceptors(): void;
  setHttpInterceptors(httpInterceptors: Function[]): { httpInterceptors: Function[] };
  setErrorConnecting(errorConnecting: boolean): { errorConnecting: boolean };
  setReadOnlyMode(readOnlyMode: boolean): { readOnlyMode: boolean };
  setEnterpriseSearchSession(entSearchSession: string): { entSearchSession: string };
}

export const HttpLogic = kea<MakeLogicType<HttpValues, HttpActions>>({
  path: ['enterprise_search', 'http_logic'],
  actions: {
    initializeHttpInterceptors: () => null,
    setHttpInterceptors: (httpInterceptors) => ({ httpInterceptors }),
    setErrorConnecting: (errorConnecting) => ({ errorConnecting }),
    setReadOnlyMode: (readOnlyMode) => ({ readOnlyMode }),
    setEnterpriseSearchSession: (entSearchSession: string) => ({ entSearchSession }),
  },
  reducers: ({ props }) => ({
    http: [props.http, {}],
    httpInterceptors: [
      [],
      {
        setHttpInterceptors: (_, { httpInterceptors }) => httpInterceptors,
      },
    ],
    errorConnecting: [
      props.errorConnecting || false,
      {
        setErrorConnecting: (_, { errorConnecting }) => errorConnecting,
      },
    ],
    readOnlyMode: [
      props.readOnlyMode || false,
      {
        setReadOnlyMode: (_, { readOnlyMode }) => readOnlyMode,
      },
    ],
  }),
  listeners: ({ values, actions }) => ({
    initializeHttpInterceptors: () => {
      const httpInterceptors = [];

      const errorConnectingInterceptor = values.http.intercept({
        responseError: async (httpResponse) => {
          if (isEnterpriseSearchApi(httpResponse)) {
            const { status } = httpResponse.response!;
            const hasErrorConnecting = status === 502;

            if (hasErrorConnecting) {
              actions.setErrorConnecting(true);
            }
          }

          // Re-throw error so that downstream catches work as expected
          return Promise.reject(httpResponse) as Promise<HttpInterceptorResponseError>;
        },
      });
      httpInterceptors.push(errorConnectingInterceptor);

      const readOnlyModeInterceptor = values.http.intercept({
        response: async (httpResponse) => {
          if (isEnterpriseSearchApi(httpResponse)) {
            const readOnlyMode = httpResponse.response!.headers.get(READ_ONLY_MODE_HEADER);

            if (readOnlyMode === 'true') {
              actions.setReadOnlyMode(true);
            } else {
              actions.setReadOnlyMode(false);
            }
          }

          return Promise.resolve(httpResponse);
        },
      });
      httpInterceptors.push(readOnlyModeInterceptor);

      const entSearchSessionInterceptor = values.http.intercept({
        response: async (httpResponse) => {
          if (isEnterpriseSearchApi(httpResponse)) {
            const entSearchSession = httpResponse.response!.headers.get(ENTERPRISE_SEARCH_SESSION_HEADER);

            if (entSearchSession) {
                actions.setEnterpriseSearchSession(entSearchSession);
            }
          }

          return Promise.resolve(httpResponse);
        },
      });
      httpInterceptors.push(entSearchSessionInterceptor);

      actions.setHttpInterceptors(httpInterceptors);
    },
    setEnterpriseSearchSession: async ({ entSearchSession }) => {
      const an_hour_from_now = 'Thu, 31 Oct 2021 07:28:00 GMT';
      document.cookie = `${ENTERPRISE_SEARCH_KIBANA_COOKIE}=${entSearchSession}; Path=/; Expires=${an_hour_from_now};`;
    },
  }),
  events: ({ values, actions }) => ({
    afterMount: () => {
      actions.initializeHttpInterceptors();
    },
    beforeUnmount: () => {
      values.httpInterceptors.forEach((removeInterceptorFn?: Function) => {
        if (removeInterceptorFn) removeInterceptorFn();
      });
    },
  }),
});

/**
 * Mount/props helper
 */
interface HttpLogicProps {
  http: HttpSetup;
  errorConnecting?: boolean;
  readOnlyMode?: boolean;
}
export const mountHttpLogic = (props: HttpLogicProps) => {
  HttpLogic(props);
  const unmount = HttpLogic.mount();
  return unmount;
};

/**
 * Small helper that checks whether or not an http call is for an Enterprise Search API
 */
const isEnterpriseSearchApi = (httpResponse: HttpResponse) => {
  const { url } = httpResponse.response!;
  return url.includes('/api/app_search/') || url.includes('/api/workplace_search/');
};
