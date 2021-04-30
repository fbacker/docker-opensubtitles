import shell from 'shelljs';

export default (_data) => new Promise((resolve, reject) => {
  const { logger } = global;
  const data = { ..._data };
  logger.log({
    level: 'info',
    label: 'ReadMetadata',
    message: `Path ${data.fullPath}`,
  });
  data.width = null;
  data.height = null;
  data.fps = null;

  let command = `ffprobe -show_entries format=nb_streams -v 0 -of compact=p=0:nk=1  "${data.media}"`;
  let response = shell.exec(command, { silent: true }).stdout;
  const numOfStreams = parseInt(response, 10);
  for (let i = 0; i < numOfStreams; i += 1) {
    const streamId = i;
    command = `ffprobe -v 0 -of csv=p=0 -select_streams ${streamId} -show_entries stream=width,height,r_frame_rate "${data.media}"`;
    response = shell.exec(command, { silent: true }).stdout;
    const values = response.split(',');
    if (values && values.length === 3) {
      if (values[0] !== 'N/A' && values[1] !== 'N/A') {
        const fps = values[2].split('/');
        data.width = parseInt(values[0], 10);
        data.height = parseInt(values[1], 10);
        data.fps = parseInt(fps[0], 10) / parseInt(fps[1], 10);
        break;
      }
    }
  }

  logger.log({
    level: 'debug',
    label: 'ReadMetadata',
    message: 'Grab media metadata',
    meta: {
      command,
      width: data.width,
      height: data.height,
      fps: data.fps,
    },
  });

  if (!data.width && !data.height && !data.fps) {
    return reject(new Error('Missing metadata in mediafile'));
  }

  return resolve(data);
});
