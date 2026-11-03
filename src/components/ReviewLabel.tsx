export function ReviewLabel({compact=false}:{compact?:boolean}){
 return <span className={`review-label ${compact?'compact':''}`}><span/>Medical review required</span>;
}
