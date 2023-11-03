import React from "react";

import Image from "next/image"

export function Status({status, finalStatus, classname}: {status: number, finalStatus: number, classname?: string | undefined}) {
    return <div className={"flex " + classname}>
        {Array.from(Array(finalStatus + 1), (e, i) => {
            if (status >= i)
                return <Image key={i} src="/img/circle-filled.svg" height={24} width={24} alt=""/>
            return <Image key={i} src="/img/circle-empty.svg" height={24} width={24} alt=""/>
        })}
        </div>
}