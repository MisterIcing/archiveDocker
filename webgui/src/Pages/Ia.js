import './Ia.css'
import styles from '../global.module.css';
import { Button, Card, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import Header from '../Components/Header';
import TabbedArea from '../Components/TabbedArea';
import { useEffect, useState } from 'react';
import axios from 'axios';

function Ia() {
  const [inputurl, setinputurl] = useState('');
  const [url, seturl] = useState('');
  const [inputGlob, setInputGlob] = useState("*");
  const [glob, setGlob] = useState ('*');
  const [inputExclude, setInputExclude] = useState('')
  const [exclude, setExclude] = useState('');
  const [resGlob, setResGlob] = useState('');
  const [resDown, setResDown] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Debounce input fields
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
        const response = await axios.post('http://localhost:5000/api/list', 
        {
          url: url,
          glob: glob,
          exclude: exclude
        });
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

  // Download when button is pressed
  async function startDownload() {
    setDownloading(true);
    setResDown(`Currently Downloading: ${url}`);
    //axios doesnt support streaming
    const res = await axios.post('http://localhost:5000/api/download',
      {
        url: url,
        glob: glob,
        exclude: exclude
      });

    if(res.status / 100 !== 2){
      console.error('Failed to start download');
      setResDown('Failed to start download');
      setDownloading(false);
      return;
    }

    // setResDown("Download Completed")
    console.log("Passed downloading");
    setDownloading(false)
  }

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
            <Button variant='outlined' disabled={downloading} startIcon={<DownloadIcon />} onClick={(eva) => startDownload()}>
              Begin Download
            </Button>
          </div>
        </div>
        <br />
        <TabbedArea url={url} globing={resGlob} downloading={resDown} active={downloading} />
      </Card>
    </div>
  );
}

export default Ia;
