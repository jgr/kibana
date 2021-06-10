/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { kea, MakeLogicType } from 'kea';

import { JSON_HEADER as headers } from '../../../../../common/constants';
import { SearchOAuth } from '../../../../../common/types';
import { clearFlashMessages, flashAPIErrors } from '../../../shared/flash_messages';
import { HttpLogic } from '../../../shared/http';

interface OAuthPreAuthServerProps {
  client_id: string;
  client_name: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  status: string;
}

interface OAuthPreAuthorization {
  clientId: string;
  clientName: string;
  redirectUri: string;
  responseType: string;
  rawScopes: string;
  scopes: string[];
  state: string;
}

interface SearchAuthorizeValues {
  redirectPending: boolean;
  cachedPreAuth: OAuthPreAuthorization;
}

interface SearchAuthorizeActions {
  setServerProps(serverProps: OAuthPreAuthServerProps): OAuthPreAuthServerProps;
  initializeSearchAuth(searchOAuth: SearchOAuth): SearchOAuth;
  authorizeSearch(): void;
  setRedirectNotPending(): void;
}

const route = '/api/workplace_search/oauth/authorize';

export const SearchAuthorizeLogic = kea<
  MakeLogicType<SearchAuthorizeValues, SearchAuthorizeActions>
>({
  path: ['enterprise_search', 'workplace_search', 'search_authorize_logic'],
  actions: {
    setServerProps: (serverProps: OAuthPreAuthServerProps) => serverProps,
    initializeSearchAuth: (searchOAuth: SearchOAuth) => searchOAuth,
    authorizeSearch: () => null,
    setRedirectNotPending: () => null,
  },
  reducers: {
    redirectPending: [
      true,
      {
        setRedirectNotPending: () => false,
      },
    ],
    cachedPreAuth: [
      {} as OAuthPreAuthorization,
      {
        setServerProps: (_, serverProps) => transformServerPreAuth(serverProps),
      },
    ],
  },
  listeners: ({ actions, values }) => ({
    initializeSearchAuth: async (searchOAuth) => {
      clearFlashMessages();
      const { http } = HttpLogic.values;

      const queryParams = {
        client_id: searchOAuth.clientId,
        response_type: 'code',
        redirect_uri: searchOAuth.redirectUrl,
        scope: 'search',
      };

      try {
        const response = await http.get(route, { queryParams });

        if (response.status === 'redirect') {
          window.location.replace(response.redirect_uri);
        } else {
          actions.setServerProps(response);
        }
      } catch (e) {
        flashAPIErrors(e);
        actions.setRedirectNotPending();
      }
    },
    authorizeSearch: async () => {
      const { http } = HttpLogic.values;
      const { cachedPreAuth } = values;

      try {
        const response = await http.post(route, {
          body: JSON.stringify({
            client_id: cachedPreAuth.clientId,
            response_type: cachedPreAuth.responseType,
            redirect_uri: cachedPreAuth.redirectUri,
            scope: cachedPreAuth.rawScopes,
            state: cachedPreAuth.state,
          }),
          headers,
        });

        window.location.replace(response.redirect_uri);
      } catch (e) {
        flashAPIErrors(e);
        actions.setRedirectNotPending();
      }
    },
  }),
});

const transformServerPreAuth = (serverProps: OAuthPreAuthServerProps): OAuthPreAuthorization => {
  return {
    clientId: serverProps.client_id,
    clientName: serverProps.client_name,
    redirectUri: serverProps.redirect_uri,
    responseType: serverProps.response_type,
    rawScopes: serverProps.scope,
    scopes: serverProps.scope.split(', '),
    state: serverProps.state,
  };
};

