import React from 'react';

const Header = () => {
    return (
        <div>
            <header className="text-center mt-[50px] uppercase">
                <div>
                    <h2 className="text-5xl text-center">
                        Invoice
                    </h2>
                </div>
                <section className="flex flex-row items-center justify-center">
                    <h1>logo</h1>
                    <h1>compny name</h1>
                </section>
            </header>
        </div>
    );
};

export default Header;