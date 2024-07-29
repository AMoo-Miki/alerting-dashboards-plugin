/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiSmallButton,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import React from 'react';
import { getApplication, getNavigationUI, getUISettings } from '../../../../services';
import {
  TopNavControlIconData,
  TopNavControlButtonData,
} from '../../../../../../../src/plugins/navigation/public';

interface MonitorDetailsHeaderProps {
  monitor: any;
  updating: boolean;
  editMonitor: () => void;
  updateMonitor: (update: any, actionKeywords?: string[]) => any;
  showJsonModal: () => void;
  onDeleteClick: () => void;
}
export const MonitorDetailsHeader = ({
  monitor,
  updating,
  editMonitor,
  updateMonitor,
  showJsonModal,
  onDeleteClick,
}: MonitorDetailsHeaderProps) => {
  const { HeaderControl } = getNavigationUI();
  const { setAppRightControls, setAppBadgeControls } = getApplication();
  const uiSettings = getUISettings();
  const showActionsInHeader = uiSettings.get('home:useNewHomePage');
  return showActionsInHeader ? (
    <>
      <HeaderControl
        setMountPoint={setAppBadgeControls}
        controls={[
          {
            renderComponent: monitor.enabled ? (
              <EuiHealth color="success">Enabled</EuiHealth>
            ) : (
              <EuiHealth color="subdued">Disabled</EuiHealth>
            ),
          },
        ]}
      />
      <HeaderControl
        setMountPoint={setAppRightControls}
        controls={[
          {
            iconType: 'trash',
            testId: 'deleteButton',
            color: 'danger',
            ariaLabel: 'Delete',
            run: onDeleteClick,
            controlType: 'icon',
          } as TopNavControlIconData,
          {
            id: 'Update monitor',
            label: monitor.enabled ? 'Disable' : 'Enable',
            testId: 'updateButton',
            isLoading: updating,
            run: () => updateMonitor({ enabled: !monitor.enabled }),
            controlType: 'button',
          } as TopNavControlButtonData,
          {
            id: 'export monitor',
            label: 'Export as JSON',
            testId: 'exportButton',
            run: showJsonModal,
            controlType: 'button',
          } as TopNavControlButtonData,
          {
            id: 'Edit monitor',
            label: 'Edit',
            testId: 'editButton',
            run: editMonitor,
            fill: true,
            controlType: 'button',
          } as TopNavControlButtonData,
        ]}
      />
    </>
  ) : (
    <>
      <EuiFlexGroup alignItems="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiText size="s" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <h1>{monitor.name}</h1>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem style={{ paddingBottom: '5px', marginLeft: '0px' }}>
          {monitor.enabled ? (
            <EuiHealth color="success">Enabled</EuiHealth>
          ) : (
            <EuiHealth color="subdued">Disabled</EuiHealth>
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton onClick={editMonitor}>Edit</EuiSmallButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            isLoading={updating}
            onClick={() => updateMonitor({ enabled: !monitor.enabled })}
          >
            {monitor.enabled ? 'Disable' : 'Enable'}
          </EuiSmallButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton onClick={showJsonModal}>Export as JSON</EuiSmallButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton onClick={onDeleteClick} color="danger">
            Delete
          </EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
    </>
  );
};
