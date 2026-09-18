import { FC } from 'react';
import { Base, Column } from '../../common';
import { DuckBoidsParticles } from './DuckBoidsParticles';

interface LoadingViewProps
{
    isError: boolean;
    message: string;
    percent: number;
}

export const LoadingView: FC<LoadingViewProps> = props =>
{
    const { isError = false, message = '', percent = 0 } = props;
    
    return (
        <Column fullHeight position="relative" className="nitro-loading">
            <DuckBoidsParticles />
            <Base className="connecting-duck" />
            <div className="loading-status-overlay">
                { isError && (message && message.length) ? (
                    <span className="loading-percentage-text text-danger">{ message }</span>
                ) : (
                    <span className="loading-percentage-text">{ Math.min(100, Math.max(0, Math.round(percent))) }%</span>
                ) }
            </div>
        </Column>
    );
}
