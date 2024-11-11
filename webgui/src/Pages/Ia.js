import './Ia.css'
import styles from '../global.module.css';
import { Card, TextField, Typography } from '@mui/material';
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
  const [res, setRes] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      seturl(inputurl);
      setGlob(inputGlob);
      setExclude(inputExclude);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputurl, inputGlob, inputExclude]);

  useEffect(() => {
    const getDryRun = async () => {
      try {
        const response = await axios.post('http://localhost:5000/api/dryrun', {
          url: url,
          glob: glob,
          exclude: exclude
        });
        setRes(response.data.result);
        console.log(`Passed dry run for ${url}\n`, response.data.result)
      }
      catch (eva) {
        console.error("Failed to get dry run: ", eva)
      }
    };

    getDryRun()
  }, [url, glob, exclude])

  return (
    <div className={styles.globalback}>
      <Header />
      <Card className={`cardcss ${styles.globalmainback}`}>
        <Typography variant='h4' className={styles.globaltitle}>
          Internet Archive
        </Typography>
        <br />
        <div style={{display: "flex"}}>
          <TextField label="URL" value={inputurl} onChange={(eva) => setinputurl(eva.target.value)}></TextField>
          <TextField label="Glob Pattern" value={inputGlob} onChange={(eva) => setInputGlob(eva.target.value)}></TextField>
          <TextField label="Exclude Pattern" value={inputExclude} onChange={(eva) => setInputExclude(eva.target.value)}></TextField>
        </div>
        <br />
        <TabbedArea url={url} output={res}/>
      </Card>
    </div>
  );
}

export default Ia;
