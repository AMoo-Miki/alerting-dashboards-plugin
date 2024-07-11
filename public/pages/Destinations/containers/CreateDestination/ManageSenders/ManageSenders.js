/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { Formik, FieldArray } from 'formik';
import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiOverlayMask,
  EuiSpacer,
} from '@elastic/eui';
import PropTypes from 'prop-types';

import Sender from '../../../components/createDestinations/Email/Sender';
import SenderEmptyPrompt from '../../../components/createDestinations/SenderEmptyPrompt';
import { senderToFormik } from './utils/helpers';
import getSenders from '../EmailSender/utils/helpers';
import { STATE } from '../../../components/createDestinations/Email/utils/constants';
import { ignoreEscape } from '../../../../../utils/helpers';
import { getDataSourceQueryObj } from '../../../../../../public/pages/utils/helpers';

const createSenderContext = (senders) => ({
  ctx: {
    senders,
  },
});

const getInitialValues = (senders) =>
  _.isEmpty(senders)
    ? { senders: [] }
    : { senders: senders.map((sender) => senderToFormik(sender)) };

export default class ManageSenders extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // initialValues is required in Formik v2, and unit test fails without giving it an object
      initialValues: {},
      sendersToDelete: [],
      loadingSenders: true,
      failedSenders: false,
    };
  }

  componentDidMount() {
    const { isEmailAllowed } = this.props;
    // Don't load initial values if Email is disallowed since the API will be blocked
    if (isEmailAllowed) {
      this.loadInitialValues();
    }
  }

  // Reload initial values when modal is no longer visible
  // or when email availability is updated
  componentDidUpdate(prevProps) {
    if (
      (prevProps.isVisible && !this.props.isVisible) ||
      prevProps.isEmailAllowed !== this.props.isEmailAllowed
    ) {
      this.loadInitialValues();
    }
  }

  loadInitialValues = async () => {
    const { httpClient } = this.props;
    this.setState({ loadingSenders: true });

    const senders = await getSenders(httpClient);
    const initialValues = getInitialValues(senders);

    this.setState({
      initialValues,
      sendersToDelete: [],
      loadingSenders: false,
    });
  };

  createSender = async (sender) => {
    const { httpClient, notifications } = this.props;
    const body = {
      name: sender.name,
      email: sender.email,
      host: sender.host,
      port: sender.port,
      method: sender.method,
    };
    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const response = await httpClient.post(`../api/alerting/destinations/email_accounts`, {
        body: JSON.stringify(body),
        query: dataSourceQuery?.query,
      });
      if (!response.ok) {
        this.setState({ failedSenders: true });
        notifications.toasts.addDanger({
          title: `Failed to create sender: ${sender.name}`,
          text: `Reason: ${response.resp}`,
        });
      }
    } catch (err) {
      console.error('Unable to create sender', err);
      this.setState({ failedSenders: true });
      notifications.toasts.addDanger({
        title: `Failed to create sender: ${sender.name}`,
        text: `Reason: ${err}`,
      });
    }
  };

  updateSender = async (updatedSender) => {
    const { httpClient, notifications } = this.props;
    const { id, ifSeqNo, ifPrimaryTerm } = updatedSender;
    const body = {
      name: updatedSender.name,
      email: updatedSender.email,
      host: updatedSender.host,
      port: updatedSender.port,
      method: updatedSender.method,
    };
    try {
      const dataSourceQuery = getDataSourceQueryObj()?.query;
      const response = await httpClient.put(`../api/alerting/destinations/email_accounts/${id}`, {
        query: { ifSeqNo, ifPrimaryTerm, dataSourceQuery },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        this.setState({ failedSenders: true });
        notifications.toasts.addDanger({
          title: `Failed to update sender: ${updatedSender.name}`,
          text: `Reason: ${response.resp}`,
        });
      }
    } catch (err) {
      console.error('Unable to update sender', err);
      this.setState({ failedSenders: true });
      notifications.toasts.addDanger({
        title: `Failed to update sender: ${updatedSender.name}`,
        text: `Reason: ${err}`,
      });
    }
  };

  deleteSender = async (sender) => {
    const { httpClient, notifications } = this.props;
    const { id } = sender;
    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const response = await httpClient.delete(
        `../api/alerting/destinations/email_accounts/${id}`,
        dataSourceQuery
      );
      if (!response.ok) {
        this.setState({ failedSenders: true });
        notifications.toasts.addDanger({
          title: `Failed to delete sender: ${sender.name}`,
          text: `Reason: ${response.resp}`,
        });
      }
    } catch (err) {
      console.error('Unable to delete sender', err);
      this.setState({ failedSenders: true });
      notifications.toasts.addDanger({
        title: `Failed to delete sender: ${sender.name}`,
        text: `Reason: ${err}`,
      });
    }
  };

  // TODO: Cleanup this function (currently making sequential API calls since each one has 'awaits' on it)
  processSenders = async (values) => {
    const { sendersToDelete } = this.state;
    const { senders } = values;

    // Create or update email senders
    for (const sender of senders) {
      if (sender.state === STATE.CREATED) {
        await this.createSender(sender);
      } else if (sender.state === STATE.UPDATED) {
        await this.updateSender(sender);
      }
    }

    // Delete any removed email senders
    for (const sender of sendersToDelete) {
      await this.deleteSender(sender);
    }

    // If there were no failures, show a success toast
    const { failedSenders } = this.state;
    if (!failedSenders) {
      this.props.notifications.toasts.addSuccess('Successfully saved senders');
    }
    this.setState({ failedSenders: false });
  };

  renderSenders = ({ values, arrayHelpers }) => {
    const hasSenders = !_.isEmpty(values.senders);
    return hasSenders ? (
      <div>
        {values.senders.map((sender, index) => (
          <div key={index}>
            <Sender
              sender={sender}
              arrayHelpers={arrayHelpers}
              context={createSenderContext(values.senders)}
              index={index}
              onDelete={() => {
                if (sender.id) {
                  this.setState((prevState) => ({
                    sendersToDelete: [...prevState.sendersToDelete, sender],
                  }));
                }
                arrayHelpers.remove(index);
              }}
            />
            <EuiSpacer className="accordion-separator" />
          </div>
        ))}
      </div>
    ) : (
      <SenderEmptyPrompt />
    );
  };

  hasSendersToProcess = (values) => {
    const { sendersToDelete } = this.state;
    return !_.isEmpty(values.senders) || !_.isEmpty(sendersToDelete);
  };

  render() {
    const { isEmailAllowed, isVisible, onClickCancel, onClickSave } = this.props;
    const { initialValues, loadingSenders } = this.state;
    return isVisible ? (
      <Formik
        initialValues={initialValues}
        onSubmit={(values, formikBag) => {
          this.processSenders(values).then(() => onClickSave());
        }}
        validateOnChange={false}
      >
        {({ values, handleSubmit, isSubmitting }) => (
          <EuiOverlayMask>
            <EuiModal
              className="modal-manage-email"
              maxWidth={1000}
              onClose={ignoreEscape(onClickCancel)}
            >
              <EuiModalHeader>
                <EuiModalHeaderTitle>Manage email senders</EuiModalHeaderTitle>
              </EuiModalHeader>

              <EuiHorizontalRule margin="s" />

              <EuiModalBody>
                <FieldArray name="senders" validateOnChange={true}>
                  {(arrayHelpers) =>
                    !isEmailAllowed || loadingSenders ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {isEmailAllowed ? 'Loading Senders...' : 'Email is disallowed'}
                      </div>
                    ) : (
                      this.renderSenders({ values, arrayHelpers })
                    )
                  }
                </FieldArray>
              </EuiModalBody>

              {this.hasSendersToProcess(values) ? (
                <div>
                  <EuiHorizontalRule margin="s" />
                  <EuiModalFooter>
                    <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
                      <EuiFlexItem grow={false}>
                        <EuiSmallButtonEmpty onClick={onClickCancel}>Close</EuiSmallButtonEmpty>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiModalFooter>
                </div>
              ) : null}
            </EuiModal>
          </EuiOverlayMask>
        )}
      </Formik>
    ) : null;
  }
}

ManageSenders.propTypes = {
  httpClient: PropTypes.object.isRequired,
  isEmailAllowed: PropTypes.bool,
  isVisible: PropTypes.bool,
  onClickCancel: PropTypes.func,
  onClickSave: PropTypes.func,
  notifications: PropTypes.object.isRequired,
};

ManageSenders.defaultProps = {
  isEmailAllowed: false,
  isVisible: false,
};
