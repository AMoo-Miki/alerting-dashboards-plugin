import React from 'react';
import { getApplication, getNavigationUI, getUISettings } from '../../../../services';

import { APP_PATH } from '../../../../utils/constants';
import { PLUGIN_NAME } from '../../../../../utils/constants';
import { EuiFlexItem, EuiSmallButton } from '@elastic/eui';

export default function NewMonitorAction() {
  const { HeaderControls } = getNavigationUI();
  const { setAppLeftControls } = getApplication();
  const uiSettings = getUISettings();
  const showActionsInHeader = uiSettings.get('home:useNewHomePage');

  return showActionsInHeader
    ? (
      <HeaderControls
        setMountPoint={setAppLeftControls}
        controls={[
          {
            id: 'Create monitor',
            label: 'Create monitor',
            iconType: 'plus',
            fill: true,
            href: `${PLUGIN_NAME}#${APP_PATH.CREATE_MONITOR}`,
            testId: 'createButton',
          },
        ]} />
    )
    : (
      <EuiFlexItem grow={false}>
        <EuiSmallButton
          fill
          href={`${PLUGIN_NAME}#${APP_PATH.CREATE_MONITOR}`}
          data-test-subj="createButton"
        >
          Create monitor
        </EuiSmallButton>
      </EuiFlexItem>
    );
}
