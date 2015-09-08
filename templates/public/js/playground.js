'use strict';

var editor = null;
var defaultQuery = '';

var App = React.createClass({
    runQuery: function() {
        if (!editor) {
            return;
        }

        this.setState({ loading: true });

        var query = editor.getValue();
        localStorage.editorValue = query;

        reqwest({
            url: '/graphql',
            type: 'json',
            method: 'POST',
            data: query,
            contentType: 'application/graphql',
            error: this.onError,
            success: this.onSuccess
        });
    },

    onError: function(res) {
        this.setState({
            error: JSON.parse(res.responseText).message,
            response: null,
            loading: false
        });
    },

    onSuccess: function(res) {
        this.setState({
            error: null,
            response: res,
            loading: false
        });
    },

    renderFeedback: function() {
        if (!this.state) {
            return null;
        }

        if (this.state.error) {
            return <QueryError errors={this.state.error} />;
        }

        return (
            <QueryResponse
                loading={this.state.loading}
                response={this.state.response}
            />
        );
    },

    getKeyBinding: function() {
        return (navigator.userAgent || '').indexOf('Macintosh') >= 0 ?
            'command + enter' : 'ctrl + enter';
    },

    render: function() {
        return (
            <div>
                <h1>sql-to-graphql playground</h1>

                <div className="pure-g">
                    <div className="pure-u-3-5">
                        <div className="wrapper" id="editor-wrapper">
                            <h2>Query ({this.getKeyBinding()} to run)</h2>
                            <Editor
                                initialValue={getInitialEditorValue()}
                                runQuery={this.runQuery}/>

                            <button
                                className="pure-button pure-button-primary"
                                onClick={this.runQuery}>Run query</button>

                            {this.renderFeedback()}
                        </div>
                    </div>
                    <div className="pure-u-2-5">
                        <div className="schema wrapper">
                            <h2>Schema</h2>
                            <Schema />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

var Schema = React.createClass({
    componentDidMount: function() {
        reqwest('/schema', this.onData);
    },

    onData: function(res) {
        this.setState({ schema: res });
    },

    render: function() {
        return this.state ? <pre>{this.state.schema}</pre> : <div>...</div>;
    }
});

var QueryError = React.createClass({
    render: function() {
        return (
            <div className="errors response">
                <h2>Errors</h2>
                {this.props.errors}
            </div>
        )
    }
});

var QueryResponse = React.createClass({
    componentDidMount: function() {
        this.setValue(this.props);
    },

    componentDidUpdate: function() {
        this.setValue(this.props);
    },

    setValue: function(props) {
        if (!this.editor) {
            var el = React.findDOMNode(this.refs.res);
            this.editor = ace.edit(el);
            this.editor.setTheme('ace/theme/monokai');
            this.editor.setShowPrintMargin(false);
            this.editor.getSession().setMode('ace/mode/json');
            this.editor.getSession().setUseWrapMode(true);
            this.editor.setReadOnly(true);
        }

        var response = (props && props.response) || {};
        if (response.data) {
            this.editor.setValue(
                JSON.stringify(response.data, null, 4),
                1
            );
        }
    },

    render: function() {
        return (
            <div className="response">
                <h2>Response</h2>
                {this.props.loading ? <div className="loading" /> : null}
                <div className="editor" ref="res" />
            </div>
        )
    }
});

var Editor = React.createClass({
    componentDidMount: function() {
        var el = React.findDOMNode(this.refs.editor);
        editor = ace.edit(el);
        editor.setTheme('ace/theme/monokai');
        editor.setShowPrintMargin(false);
        editor.commands.addCommand({
            name: 'runQuery',
            bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
            exec: this.props.runQuery
        });
    },

    shouldComponentUpdate: function() {
        return false;
    },

    render: function() {
        return (
            <div className="editor" ref="editor">{this.props.initialValue}</div>
        );
    }
});

React.render(
    <App />,
    document.getElementById('container')
);

function getInitialEditorValue() {
    return localStorage.editorValue || defaultQuery;
}
