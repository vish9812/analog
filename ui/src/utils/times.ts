function diffMinutes(date1: Date, date2: Date) {
  let diff = (date2.getTime() - date1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

function debounce(fn: Function, delayMS: number): Function {
  let timer: ReturnType<typeof setTimeout>;

  return function (...args: any[]) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, delayMS);
  };
}

const timesUtils = {
  diffMinutes,
  debounce,
};
export default timesUtils;
