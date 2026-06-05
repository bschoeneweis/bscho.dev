use anyhow::Result;
use hound::WavReader;

#[derive(Debug, Clone)]
struct Audio {
    sample_rate: u32,
    samples: Vec<f32>,
}

pub const SAMPLE_RATE: u32 = 44_100;

fn read_wav_as_mono_f32(path: &str) -> Result<Audio> {
    let mut reader = WavReader::open(path)?;
    let spec = reader.spec();

    // validate that all of our WAV files have the same spec
    anyhow::ensure!(
        spec.channels == 2
            && spec.sample_rate == SAMPLE_RATE
            && spec.bits_per_sample == 16
            && spec.sample_format == hound::SampleFormat::Int,
        "expected stereo (2 channel) 44.1kHz 16-bit PCM WAV"
    );

    // convert our 16 bit sample values into f32 and normalize
    // so our scale is [-1.0, 1.0]
    let stereo = reader
        .samples::<i16>()
        .map(|s| s.map(|v| v as f32 / i16::MAX as f32))
        .collect::<Result<Vec<_>, _>>()?;

    // downmix stereo -> mono by averaging each frame
    let mut mono_samples = stereo
        .chunks_exact(2)
        .map(|frame| (frame[0] + frame[1]) / 2.0)
        .collect::<Vec<_>>();

    // normalize the recording's amplitude so recordings captured
    // at different volumes are more comparable
    let max = mono_samples
        .iter()
        .copied()
        .map(f32::abs)
        .fold(0.0, f32::max);

    if max > 0.0 {
        for sample in &mut mono_samples {
            *sample /= max;
        }
    }

    Ok(Audio {
        sample_rate: SAMPLE_RATE,
        samples: mono_samples,
    })
}

fn main() -> Result<()> {
    let audio = read_wav_as_mono_f32("data/XC1134252_zitting_cisticola.wav")?;
    println!("{:?}", audio);
    // WavSpec {
    //     channels: 2,
    //     sample_rate: 44100,
    //     bits_per_sample: 16,
    //     sample_format: Int,
    // }

    // read_wav_as_mono_f32("data/index_data/XC855521_whiskered_wren.wav")?;
    // WavSpec {
    //     channels: 2,
    //     sample_rate: 44100,
    //     bits_per_sample: 16,
    //     sample_format: Int,
    // }

    // read_wav_as_mono_f32("data/index_data/XC1002754_zitting_cisticola.wav")?;
    // WavSpec {
    //     channels: 2,
    //     sample_rate: 44100,
    //     bits_per_sample: 16,
    //     sample_format: Int,
    // }

    // read_wav_as_mono_f32("data/index_data/XC957560_bay_wren.wav")?;
    // WavSpec {
    //     channels: 2,
    //     sample_rate: 44100,
    //     bits_per_sample: 16,
    //     sample_format: Int,
    // }

    // read_wav_as_mono_f32("data/index_data/XC1059343_eurasian_scops_owl.wav")?;
    // WavSpec {
    //     channels: 2,
    //     sample_rate: 44100,
    //     bits_per_sample: 16,
    //     sample_format: Int,
    // }

    // read_wav_as_mono_f32("data/index_data/XC1105587_thrush_nightingale.wav")?;
    // WavSpec {
    //     channels: 2,
    //     sample_rate: 44100,
    //     bits_per_sample: 16,
    //     sample_format: Int,
    // }

    Ok(())
}
