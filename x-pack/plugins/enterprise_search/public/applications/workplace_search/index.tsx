/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect } from 'react';
import { Route, Redirect, Switch, useLocation } from 'react-router-dom';

import { useActions, useValues } from 'kea';

import { WORKPLACE_SEARCH_PLUGIN } from '../../../common/constants';
import { InitialAppData } from '../../../common/types';
import { HttpLogic } from '../shared/http';
import { KibanaLogic } from '../shared/kibana';
import { Layout } from '../shared/layout';
import { NotFound } from '../shared/not_found';

import { AppLogic } from './app_logic';
import { WorkplaceSearchNav, WorkplaceSearchHeaderActions } from './components/layout';
import {
  GROUPS_PATH,
  SETUP_GUIDE_PATH,
  SEARCH_AUTHORIZE_PATH,
  SOURCES_PATH,
  SOURCE_ADDED_PATH,
  OAUTH_AUTHORIZE_PATH,
  PERSONAL_SOURCES_PATH,
  ORG_SETTINGS_PATH,
  ROLE_MAPPINGS_PATH,
  SECURITY_PATH,
  PERSONAL_SETTINGS_PATH,
  PERSONAL_PATH,
} from './routes';
import { AccountSettings } from './views/account_settings';
import { SourcesRouter } from './views/content_sources';
import { SourceAdded } from './views/content_sources/components/source_added';
import { ErrorState } from './views/error_state';
import { GroupsRouter } from './views/groups';
import { OAuthAuthorize } from './views/oauth_authorize';
import { Overview } from './views/overview';
import { RoleMappings } from './views/role_mappings';
import { SearchAuthorize } from './views/search_authorize';
import { Security } from './views/security';
import { SettingsRouter } from './views/settings';
import { SetupGuide } from './views/setup_guide';

export const WorkplaceSearch: React.FC<InitialAppData> = (props) => {
  const { config } = useValues(KibanaLogic);
  return !config.host ? <WorkplaceSearchUnconfigured /> : <WorkplaceSearchConfigured {...props} />;
};

export const WorkplaceSearchConfigured: React.FC<InitialAppData> = (props) => {
  const { hasInitialized } = useValues(AppLogic);
  const { initializeAppData, setContext } = useActions(AppLogic);
  const { renderHeaderActions, setChromeIsVisible } = useValues(KibanaLogic);
  const { errorConnecting, readOnlyMode } = useValues(HttpLogic);

  const { pathname } = useLocation();

  /**
   * Personal dashboard urls begin with /p/
   * EX: http://localhost:5601/app/enterprise_search/workplace_search/p/sources
   */

  const personalSourceUrlRegex = /^\/p\//g; // matches '/p/*'
  const isOrganization = !pathname.match(personalSourceUrlRegex); // TODO: Once auth is figured out, we need to have a check for the equivilent of `isAdmin`.

  setContext(isOrganization);

  useEffect(() => {
    setChromeIsVisible(isOrganization);
  }, [pathname]);

  useEffect(() => {
    if (!hasInitialized) {
      initializeAppData(props);
      renderHeaderActions(WorkplaceSearchHeaderActions);
    }
  }, [hasInitialized]);

  return (
    <Switch>
      <Route path={SETUP_GUIDE_PATH}>
        <SetupGuide />
      </Route>
      <Route path={SOURCE_ADDED_PATH}>
        <SourceAdded />
      </Route>
      <Route exact path="/">
        <Overview />
      </Route>
      <Route path={PERSONAL_PATH}>
        <Switch>
          <Route path={PERSONAL_SOURCES_PATH}>
            <SourcesRouter />
          </Route>
          <Route path={PERSONAL_SETTINGS_PATH}>
            <AccountSettings />
          </Route>
          <Route path={OAUTH_AUTHORIZE_PATH}>
            <OAuthAuthorize />
          </Route>
          <Route path={SEARCH_AUTHORIZE_PATH}>
            <SearchAuthorize />
          </Route>
        </Switch>
      </Route>
      <Route path={SOURCES_PATH}>
        <SourcesRouter />
      </Route>
      <Route path={GROUPS_PATH}>
        <GroupsRouter />
      </Route>
      <Route path={ROLE_MAPPINGS_PATH}>
        <RoleMappings />
      </Route>
      <Route path={SECURITY_PATH}>
        <Security />
      </Route>
      <Route path={ORG_SETTINGS_PATH}>
        <SettingsRouter />
      </Route>
      <Route>
        <Layout navigation={<WorkplaceSearchNav />} restrictWidth readOnlyMode={readOnlyMode}>
          {errorConnecting ? (
            <ErrorState />
          ) : (
            <Route>
              <NotFound product={WORKPLACE_SEARCH_PLUGIN} />
            </Route>
          )}
        </Layout>
      </Route>
    </Switch>
  );
};

export const WorkplaceSearchUnconfigured: React.FC = () => (
  <Switch>
    <Route exact path={SETUP_GUIDE_PATH}>
      <SetupGuide />
    </Route>
    <Route>
      <Redirect to={SETUP_GUIDE_PATH} />
    </Route>
  </Switch>
);
