import React ,{useState}from "react";
import './Cal.css'
export default function Cal(){

const[value,setValue] = useState('')

const handleClicks=(e)=>{
    setValue(value+ e.target.value);
}
const handleDelete =()=>{
    setValue(value.slice(0,-1));
}

const handleEquals =()=>{
    try {
        if(value.includes('/0'))
            throw new Error("cannot divide by zero")
        setValue(eval(value).toString());
    } catch (err) {
        setValue("Error")
    }
}
    return(
        <div className="container">
            <div className="calculator">
                <form action="" className="form">
                    <div className="display">
                        <input type="text"  value={value} readOnly/>
                    </div>
                    <div>
                        <input type="button" value="()"  onClick={handleClicks}/>
                        <input type="button" value="%"  onClick={handleClicks}/>
                        <input type="button" value="/"  onClick={handleClicks}/>
                        <input type="button" value="C"  onClick={handleDelete}/>
                    </div>
                     <div>
                        <input type="button" value="7" onClick={handleClicks} />
                        <input type="button" value="8" onClick={handleClicks}/>
                        <input type="button" value="9" onClick={handleClicks}/>
                        <input type="button" value="*" onClick={handleClicks}/>
                    </div>
                     <div>
                        <input type="button" value="4" onClick={handleClicks}/>
                        <input type="button" value="5" onClick={handleClicks}/>
                        <input type="button" value="6" onClick={handleClicks}/>
                        <input type="button" value="-" onClick={handleClicks}/>
                    </div>
                     <div>
                        <input type="button" value="1" onClick={handleClicks}/>
                        <input type="button" value="2" onClick={handleClicks}/>
                        <input type="button" value="3" onClick={handleClicks}/>
                        <input type="button" value="+" onClick={handleClicks}/>
                    </div>
                     <div>
                        <input type="button" value="0" onClick={handleClicks}/>
                        <input type="button" value="," onClick={handleClicks}/>
                        <input type="button" value="=" className="equal" onClick={handleEquals}/>
                    </div>
                </form>
            </div>
        </div>
    )
}