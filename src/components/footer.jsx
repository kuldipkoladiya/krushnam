import React from 'react';

const Footer = ({hendalPrint}) => {

    return (
        <div>
            <div className="ml-[200px] mt-[20px]">

                <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow " onClick={hendalPrint}>
                    Print
                </button>
                <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow " >
                    Download
                </button>

            </div>
        </div>
    );
};

export default Footer;