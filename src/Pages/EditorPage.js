import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import Editor from '../components/Editor'
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e) {
        console.log('socket error', e);
        toast.error('Socket connection failed, try again later.');
        reactNavigator('/');
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      //listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED, 
        ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room`);
          console.log(`${username} joined`);
        }

        setClients(clients);
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        })
      });

         //listening for disconnected
      socketRef.current.on(
        ACTIONS.DISCONNECTED,
        ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
      
      // window.location.reload();

    };

    // puting init in return beacuse outside it causing double user problem

    return () => {
      init();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, []);


    async function copyRoomId(){
      try{
        await navigator.clipboard.writeText(roomId);
        toast.success(`Room ID has been copied to your clipboard`)
      }catch(err){
        toast.error('could not copy the Room ID')
        console.log(err)
      }
    }

    async function leaveRoom(){
      if(socketRef.current){
        //notify the server that the user is leaving the room
      // socketRef.current.emit(ACTIONS.LEAVE, { roomId });
      //disconnect from the socket
      socketRef.current.disconnect();
      // window.location.reload();

      // Reload the page # Doing this beacuse it rejoin the room

      }
      window.location.reload();
      reactNavigator('/')
      window.location.reload();


    }


  if (!location.state) {
    return <Navigate to='/' />;
  }

  return (
    <div className='mainWrap'>
      <div className='aside'>
        <div className='asideInner'>
          <div className='logo'>
            <img className='logoImage' src='/code-boxs.png' alt='logo' />
          </div>
          <h3>Connected</h3>
          <div className='clientsList'>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className='btn copyBtn' onClick={copyRoomId}>Copy Room ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
      </div>
      <div className='editorWrap'>
        <Editor 
        socketRef={socketRef} 
        roomId={roomId} 
        onCodeChange={(code)=>{
          codeRef.current = code;
          }} />
      </div>
    </div>
  );
};

export default EditorPage;
