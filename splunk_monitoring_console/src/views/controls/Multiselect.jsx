import React from 'react';
import ReactAdapterBase from 'splunk_monitoring_console/views/ReactAdapterBase';
import BackboneProvider from './BackboneProvider';
import Multiselect from '@splunk/react-ui/Multiselect';

export default ReactAdapterBase.extend({
    createComponent() {
        const { children, props = {} } = this.options;
        if (!children) {
            return null;
        }
        const optionNodes = children.map(child => <Multiselect.Option {...child} />);
        return (
            <Multiselect {...props} >
                {optionNodes}
            </Multiselect>
        );
    },

    getComponent() {
        return (
            <BackboneProvider store={{}}>
                {this.createComponent()}
            </BackboneProvider>
        );
    },
});
