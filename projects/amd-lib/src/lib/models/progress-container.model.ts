import { ReflectiveInjector } from '@angular/core';
import { DateUtil } from '../utils/date.util';
import { ISizeContainer, SizeContainer } from './size-container.model';
import { DecimalByteUnit } from '../enums/decimal-byte-unit.enum';

export interface IProgressContainer {
    total: number; // bytes
    progressTimestamp: number; // milliseconds
    bitrateTimestamp: number; // milliseconds
    bitrate: number; // bit/s
    percent: number; // 0-100
    displayBitrate: string;
    displayTimeLeft: string;
    loadedSizeContainer: ISizeContainer;
    totalSizeContainer: ISizeContainer;
    reset(total: number): void;
    updateProgress(now: number, loaded: number, interval: number): void;
    updateBitrate(now: number, loaded: number, interval: number): void;
}

export class ProgressContainer implements IProgressContainer {
    private dateUtil: DateUtil;
    private loaded: number; // bytes
    private bitrateSizeContainer: ISizeContainer;

    public total: number;
    public progressTimestamp: number;
    public bitrateTimestamp: number;
    public bitrate: number;
    public percent: number;
    public displayBitrate: string;
    public displayTimeLeft: string;
    public loadedSizeContainer: ISizeContainer;
    public totalSizeContainer: ISizeContainer;

    public constructor(total: number) {
        const injector = ReflectiveInjector.resolveAndCreate([DateUtil]);
        this.dateUtil = injector.get(DateUtil);

        this.bitrateSizeContainer = new SizeContainer();
        this.loadedSizeContainer = new SizeContainer();
        this.totalSizeContainer = new SizeContainer();
        this.reset(total);
    }

    public reset(total: number): void {
        this.progressTimestamp = this.dateUtil.now();
        this.bitrateTimestamp = this.dateUtil.now();
        this.loaded = 0;
        this.bitrate = 0;
        this.percent = 0;
        this.total = total;
        this.displayBitrate = undefined;
        this.displayTimeLeft = undefined;
        this.bitrateSizeContainer.updateDecimal(DecimalByteUnit.Byte, this.bitrate);
        this.loadedSizeContainer.updateDecimal(DecimalByteUnit.Byte, this.loaded);
        this.totalSizeContainer.updateDecimal(DecimalByteUnit.Byte, this.total);
    }

    public updateProgress(now: number, loaded: number, interval: number): void {
        const timeDiff = now - this.progressTimestamp;
        // console.log('loaded: ' + loaded + ' total: ' + this.total);
        if (!this.percent || timeDiff > interval) {
            this.percent = Number((loaded / this.total * 100).toFixed(2));
            this.loaded = loaded;
            this.loadedSizeContainer.updateDecimal(DecimalByteUnit.Byte, this.loaded);
            this.progressTimestamp = now;
            if (this.bitrate > 0) {
                this.displayTimeLeft = this.dateUtil.format((this.total - this.loaded) * 8 / this.bitrate);
            } else {
                this.displayTimeLeft = this.dateUtil.format(0);
            }
        } else if (loaded >= this.total) {
            this.percent = 100;
            this.loaded = this.total;
        }
    }

    public updateBitrate(now: number, loaded: number, interval: number): void {
        const timeDiff = now - this.bitrateTimestamp;
        if (!this.bitrate || timeDiff > interval) {
            this.bitrate = (loaded - this.loaded) * (1000 / timeDiff) * 8;
            if (this.bitrate === Number.POSITIVE_INFINITY || this.bitrate === Number.NEGATIVE_INFINITY) {
                this.bitrate = 0;
            }
            this.bitrateSizeContainer.updateDecimal(DecimalByteUnit.Byte, this.bitrate / 8);
            this.displayBitrate = this.bitrateSizeContainer.displaySize + ' ' + this.bitrateSizeContainer.displayUnit + '/s';
            this.bitrateTimestamp = now;
        }
    }
}
