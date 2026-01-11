import useStore from '../store';
import { VesselSnapshot } from '../types/vessel.types';

interface VesselListProps {
  vessels: Record<string, VesselSnapshot>;
}
export const VesselList = ({ vessels }: VesselListProps) => {
  const vessel = useStore(state => state.vessel);
  return (
    <div>
      Own vessel: {vessel.properties.name}
      <br />
      Vessel position: {vessel.position.lat} lat, {vessel.position.lon} lon
      <ul>
        {Object.values(vessels).map(vessel => (
          <div key={vessel.id}>
            <li>{vessel.properties?.name}</li>
          </div>
        ))}
      </ul>
    </div>
  );
};
