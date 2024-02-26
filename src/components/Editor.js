import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import ACTIONS from '../Actions';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/lib/codemirror.css';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    //double editor problem causing here 
    async function init(){
      const editorElement = document.getElementById('realtimeEditor');
      if (!editorElement) return;

    editorRef.current = Codemirror.fromTextArea(editorElement, {
      mode: { name: 'javascript', json: true },
      theme: 'dracula',
      autoCloseTags: true,
      autoCloseBrackets: true,
      lineNumbers: true,
    });

    editorRef.current.on('change', (instance, changes) => {
      const { origin } = changes;
      const code = instance.getValue();
      onCodeChange(code)
      if (origin !== 'setValue') {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code,
        });
      }
    });
  };
    // puting init in return beacuse it gives double code editor outside the return
    return()=>{
      init();
      }
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }

    // return ()=>{
    //   socketRef.current.off(ACTIONS.CODE_CHANGE)
    // };

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
      }
    };

  }, [socketRef.current]);

  return <textarea id='realtimeEditor'></textarea>;
};

export default Editor;
