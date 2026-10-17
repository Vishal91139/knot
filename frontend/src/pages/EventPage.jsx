import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, getMyEventRegistration, registerForEvent, unregisterFromEvent } from '../api/events';

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

const EventPage = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [registration, setRegistration] = useState({ registered: false, status: null });
    const [registering, setRegistering] = useState(false);
    const [registerError, setRegisterError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                const payload = await getEventById(eventId);
                setEvent(payload?.data || null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    useEffect(() => {
        const fetchRegistration = async () => {
            try {
                const payload = await getMyEventRegistration(eventId);
                const data = payload?.data;
                setRegistration({ registered: !!data, status: data?.status || null });
            } catch (_err) {
                // ignore: not logged in / not a student / no registration
                setRegistration({ registered: false, status: null });
            }
        };

        if (eventId) fetchRegistration();
    }, [eventId]);

    if (loading) {
        return <div className="text-center py-10">Loading event details...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">Error: {error}</div>;
    }

    if (!event) {
        return <div className="text-center py-10">Event not found.</div>;
    }

    const title = event?.title || 'Untitled event';
    const organizerName = event?.organizer?.org_name || '—';
    const collegeName = event?.college?.short_name || event?.college?.name || '—';
    const banner = event?.banner_url || event?.poster_url || null;
    const about = event?.long_description || event?.short_description || '';
    const category = event?.category || 'other';
    const eventType = event?.event_type || 'incollege';
    const mode = event?.mode || 'offline';
    const modeLabel = mode === 'online' ? 'Online' : mode === 'hybrid' ? 'Hybrid' : 'Offline';
    const venue = mode === 'online' ? 'Online' : event?.venue_name || event?.venue_address || '—';
    const status = event?.status || '—';
    const capacity = event?.max_capacity ?? null;
    const start = event?.start_datetime;
    const end = event?.end_datetime;
    const registrationDeadline = event?.registration_deadline;
    const isPaid = !!event?.is_paid;
    const entryFee = event?.entry_fee;
    const currency = event?.currency || 'INR';
    const isTeamEvent = !!event?.is_team_event;
    const onlineLink = event?.online_link || null;

    const onRegisterClick = async () => {
        try {
            setRegisterError(null);
            setRegistering(true);

            if (registration.registered) {
                await unregisterFromEvent(eventId);
                setRegistration({ registered: false, status: null });
            } else {
                const payload = await registerForEvent(eventId);
                const data = payload?.data;
                setRegistration({ registered: true, status: data?.status || 'confirmed' });
            }
        } catch (err) {
            setRegisterError(err?.message || 'Registration failed');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard/student" className="text-blue-400 hover:underline mb-6 block">&larr; Back to all events</Link>

                <div className="relative rounded-lg overflow-hidden mb-8">
                    {banner ? (
                        <img src={banner} alt={`${title} banner`} className="w-full h-64 object-cover" />
                    ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-gray-800 to-gray-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                        <h1 className="text-4xl font-bold text-white">{title}</h1>
                        <p className="text-lg text-gray-300">{organizerName}</p>
                        <p className="text-sm text-gray-400">{collegeName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-semibold mb-4">About the Event</h2>
                        <p className="text-gray-300 whitespace-pre-wrap">{about || '—'}</p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Details</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold">Date & Time</h3>
                                <p className="text-gray-400">{formatDateTime(start)} - {formatDateTime(end)}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Mode</h3>
                                <p className="text-gray-400">{modeLabel}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Venue</h3>
                                <p className="text-gray-400 break-words">{venue}</p>
                            </div>
                            {mode === 'online' && onlineLink && (
                                <div>
                                    <h3 className="font-semibold">Online Link</h3>
                                    <a className="text-blue-400 hover:underline break-words" href={onlineLink} target="_blank" rel="noreferrer">
                                        {onlineLink}
                                    </a>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold">Registration Deadline</h3>
                                <p className="text-gray-400">{formatDate(registrationDeadline)}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Category</h3>
                                <p className="text-gray-400 capitalize">{String(category).replace('_', ' ')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Event Type</h3>
                                <p className="text-gray-400 capitalize">{String(eventType).replace('_', ' ')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Mode</h3>
                                <p className="text-gray-400 capitalize">{String(mode).replace('_', ' ')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Capacity</h3>
                                <p className="text-gray-400">{capacity ? `${capacity} participants` : 'Open to all'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Team Event</h3>
                                <p className="text-gray-400">{isTeamEvent ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Entry Fee</h3>
                                <p className="text-gray-400">{isPaid ? `${entryFee ?? 0} ${currency}` : 'Free'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Status</h3>
                                <p className="text-gray-400 capitalize">{status}</p>
                            </div>
                        </div>
                        {registerError && (
                            <p className="mt-4 text-sm text-red-400">{registerError}</p>
                        )}
                        <button
                            onClick={onRegisterClick}
                            disabled={registering}
                            className={`w-full mt-6 text-white font-bold py-3 rounded-lg transition-colors ${
                                registration.registered
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } disabled:opacity-60`}
                        >
                            {registering
                                ? 'Please wait…'
                                : registration.registered
                                    ? (registration.status === 'waitlisted' ? 'Waitlisted ✓' : 'Registered ✓')
                                    : 'Register'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPage;
