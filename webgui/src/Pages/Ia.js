import './Ia.css'
import styles from '../global.module.css';
import { Button, Card, IconButton, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import Header from '../Components/Header';
import TabbedArea from '../Components/TabbedArea';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {io} from 'socket.io-client';

function Ia() {
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Variables
  const [inputurl, setinputurl] = useState('');           // URL/Identifier input field 
  const [url, seturl] = useState('');                     // URL/Identifier debounced
  const [inputGlob, setInputGlob] = useState("*");        // Glob pattern input field
  const [glob, setGlob] = useState ('*');                 // Glob pattern debounced
  const [inputExclude, setInputExclude] = useState('');   // Exclude pattern input field
  const [exclude, setExclude] = useState('');             // Exclude pattern debounced

  const [resGlob, setResGlob] = useState('');             // Output of ia file searching
  const [active, setActive] = useState(false);            // Used to determine if currently downloading
  const [status, setStatus] = useState("Inactive");       // Status of task polling
  const [currTask, setCurrTask] = useState("");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Dry run functions

  // Debounce input fields, so it doesnt constantly update per char change
  useEffect(() => {
    const timer = setTimeout(() => {
      seturl(inputurl);
      setGlob(inputGlob);
      setExclude(inputExclude);
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputurl, inputGlob, inputExclude]);

  // Auto get list of files when fields are updated after debounce
  useEffect(() => {
    const getDryRun = async () => {
      try {
        let set = `http://${window.location.hostname}:5000/api/list/${url}`
        if(!url){
          setResGlob("Invalid url")
          return
        }
        let params = [];
        if(glob) params.push(`glob=${encodeURIComponent(glob)}`);
        if(exclude) params.push(`exclude=${encodeURI(exclude)}`);
        if(params.length > 0) set += `?${params.join('&')}`;

        const response = await axios.get(set);

        setResGlob(response.data.result);
        console.log(`Passed dry run for ${url}\n`, response.data.result)
      }
      catch (eva) {
        console.error("Failed to get dry run: ", eva)
        setResGlob(`Error retriving list for: ${url}\nMay not have been able to determine identifier`);
      }
    };

    getDryRun()
  }, [url, glob, exclude]);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Downloading functions

  // Start download when button is pressed
  async function startDownload() {
    setActive(true);
    const res = await axios.post(`http://${window.location.hostname}:5000/api/download`,{
        url: url,
        glob: glob,
        exclude: exclude
      });

    if(res.status < 200 || res.status >= 300){
      console.error('Failed to start download');
      setActive(false);
      setStatus('Failed')
      return;
    }

    console.log(`Started download task: ${res.data.task_id}`)
    setStatus(`Task: ${res.data.task_id}`);

    const socket = io(`http://${window.location.hostname}:5000`, {transports: ['websocket', 'polling']});
    setCurrTask(res.data.task_id);

    socket.on('task_status', (data) => {
      console.log(data);

      if(data.status === 'Completed'){
        setStatus("Complete")
        setCurrTask("");
        setActive(false);
        socket.disconnect();
      }
    })
  };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Display JSX

  return (
    <div className={styles.globalback}>
      <Header />
      <Card className={`cardcss ${styles.globalmainback}`}>
        <Typography variant='h4' className={styles.globaltitle}>
          Internet Archive
        </Typography>
        <br />
        <div style={{display: "flex", alignItems: 'center', justifyContent: 'space-between',}}>
          <div className='leftInputs'>
            <TextField label="URL/Identifier" value={inputurl} onChange={(eva) => setinputurl(eva.target.value)}></TextField>
            <TextField label="Glob Pattern" value={inputGlob} onChange={(eva) => setInputGlob(eva.target.value)}></TextField>
            <TextField label="Exclude Pattern" value={inputExclude} onChange={(eva) => setInputExclude(eva.target.value)}></TextField>
          </div>
          <div className="rightInputs">
            <Button variant='outlined' disabled={active} startIcon={<DownloadIcon />} onClick={(eva) => startDownload()}>
              Begin Download
            </Button>
            <div>
              <Typography>
                {status}
              </Typography>
            </div>
          </div>
        </div>
        <br />
        <TabbedArea url={url} globing={resGlob} />
      </Card>
    </div>
  );
}

export default Ia;
