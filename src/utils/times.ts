function diffMinutes(date1: Date, date2: Date) {
  let diff = (date2.getTime() - date1.getTime()) / 1000;
  diff /= 60;
  console.log(Math.abs(Math.round(diff)));
  return Math.abs(Math.round(diff));
}

const timesUtils = {
  diffMinutes,
};
export default timesUtils;
